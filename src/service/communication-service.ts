import Api from '../api';
import Cryptography from '../cryptography';
import { NotificationsFilter, OtrNotification, OtrNotificationsBundle, OtrPostResult } from '../api/types';
import { DecryptedNotification } from './types';
import { AssetId, ClientId, ConversationId } from '../model';
import { AssetMetadata, OtrMessage } from '../model/messages';
import { Base64EncodedString } from '../cryptography/types';

export default class CommunicationService {
  constructor(
    private readonly api: Api,
    private readonly cryptography: Cryptography,
    private readonly thisClientId: ClientId
  ) {
  }

  /**
   * Shares given file to the given conversation.
   * @param conversationId ID of the conversation where should be asset posted.
   * @param asset asset - in form of file from browser.
   * @param metadata metadata about the asset.
   */
  shareAsset = async (conversationId: ConversationId, asset: File, metadata: AssetMetadata): Promise<OtrPostResult> => {
    // obtain information about the conversation, prefetch data without blocking
    const preKeyBundlePromise = this.api.getPrekeysForConversation(conversationId).then(
      preKeysBundles => ({ ...preKeysBundles.me, ...preKeysBundles.recipients }) // TODO maybe filter this client?
    );
    // read file to buffer
    const buffer = Buffer.from(await asset.arrayBuffer());
    // encrypt asset
    const { cipherText, key, sha256 } = await this.cryptography.encryptAsset(buffer);
    // upload it to the servers
    const { assetId } = await this.api.uploadAsset(cipherText);
    // build otr message
    const assetMessage = { conversationId, assetId, key, sha256, metadata };
    const otrMessage: OtrMessage = { type: 'new-asset', data: assetMessage };
    // encrypt envelopes
    const envelopes = await this.cryptography.encryptToEnvelopes(this.thisClientId, otrMessage, await preKeyBundlePromise);
    // and ship them!
    return this.api.postOtrEnvelope(envelopes);
  };

  /**
   * Downloads and decrypts asset.
   * @param assetId ID of the asset to download
   * @param key decryption key for the asset
   * @param sha256 SHA256 of the cipher text, received in the event
   * @returns Buffer decrypted file buffer
   */
  downloadAsset = async (assetId: AssetId, key: Base64EncodedString, sha256: Base64EncodedString): Promise<Buffer> => {
    // download asset
    const cipherText = await this.api.downloadAsset(assetId);
    // and decrypt it
    return this.cryptography.decryptAsset({ cipherText, key, sha256 });
  };

  /**
   * Fetches and decrypts all notifications for given filter.
   * @param filter see Api.getNotifications
   */
  fetchAllNotifications = async (filter?: NotificationsFilter): Promise<DecryptedNotification[]> => {
    const notifications: OtrNotification[] = [];
    let bundle: OtrNotificationsBundle;
    // fetch all notifications
    do {
      bundle = await this.api.getNotifications(this.thisClientId, filter);
      notifications.push(...bundle.notifications);
    } while (bundle.hasMore);
    // and now let's decrypt it and map it
    const decryptionQueue = notifications.map(async (notification) => {
      // TODO what if this fails?
      const otrMessage = await this.cryptography.decryptEnvelope(notification.envelope);
      return {
        notificationId: notification.notificationId,
        createdAt: notification.createdAt,
        senderClientId: notification.envelope.senderClientId,
        recipientClientId: notification.envelope.recipientClientId,
        otrMessage
      };
    });
    // let's wait until all of them are decrypted and respond with decrypted data
    return await Promise.all(decryptionQueue);
  };
}
