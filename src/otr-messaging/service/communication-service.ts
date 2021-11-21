import Api from '../api';
import { AssetSharedResponse } from './model';
import { AssetId, ClientId, TopicId } from '../model';
import { AssetMetadata, OtrEncryptedEvent, OtrMessage, OtrMessageEnvelope, OtrMessageType } from '../model/messages';
import { Base64EncodedString } from '../cryptography/model';
import CryptographyService from '../cryptography';
import { EventsFilter } from '../api/model/otr';
import { DecryptedOtrEvent } from '../model/events';

export default class CommunicationService {
  constructor(
    private readonly api: Api,
    private readonly cryptography: CryptographyService,
    private readonly thisClientId: ClientId
  ) {
  }

  /**
   * Shares given file to the given conversation.
   * @param topicId ID of the topic where should be asset posted.
   * @param asset asset - in form of buffer.
   * @param metadata metadata about the asset.
   */
  shareAsset = async (topicId: TopicId, asset: BufferSource, metadata: AssetMetadata): Promise<AssetSharedResponse> => {
    // obtain information about the conversation, prefetch data without blocking
    const preKeyBundlePromise = this.api.getPrekeysForTopic(topicId).then(
      preKeysBundles => ({ ...preKeysBundles.me, ...preKeysBundles.recipients }) // TODO maybe filter this client?
    );
    // encrypt asset
    const { cipherText, key, sha256 } = await this.cryptography.encryptAsset(asset);
    // upload it to the servers
    const assetUploadResult = await this.api.uploadAsset(cipherText);
    // build otr message
    const assetMessage: OtrMessage = { topicId, assetId: assetUploadResult.assetId, key, sha256, metadata };
    const otrMessage: OtrMessageEnvelope = { type: OtrMessageType.NEW_ASSET, data: assetMessage };
    // encrypt envelopes
    const envelopes = await this.cryptography.encryptEnvelopes(this.thisClientId, otrMessage, await preKeyBundlePromise);
    // and ship them!
    const otrResult = await this.api.postOtrEnvelopes(topicId, envelopes);
    return { ...assetUploadResult, ...otrResult };
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
   * Fetches and decrypts all events for given filter.
   * @param clientId ID of the receiving client
   * @param filter see Api.getEvents
   */
  fetchAllEvents = async (clientId: ClientId, filter?: EventsFilter): Promise<DecryptedOtrEvent[]> => {
    const eventsToDecrypt: OtrEncryptedEvent[] = [];
    let hasMoreEvents = false;
    // fetch all events
    do {
      const bundle = await this.api.getEvents(this.thisClientId, filter);
      eventsToDecrypt.push(...bundle.events);
      hasMoreEvents = bundle.hasMore;
    } while (hasMoreEvents);
    // and now let's decrypt it and map it
    const decryptionQueue = eventsToDecrypt.map(async (event) => {
      // TODO what if this fails?
      const otrMessageEnvelope = await this.cryptography.decryptEnvelope(event.envelope);
      return {
        eventId: event.eventId,
        createdAt: event.createdAt,
        sendingUser: event.sendingUser,
        senderClientId: event.envelope.senderClientId,
        recipientClientId: event.envelope.recipientClientId,
        otrMessageEnvelope
      };
    });
    // let's wait until all of them are decrypted and respond with decrypted data
    return await Promise.all(decryptionQueue);
  };
}
