import Api from '../api';
import { AssetSharedResponse, OtrResult } from './model';
import { AssetId, ClientId, TopicId } from '../model';
import { AssetMetadata, OtrEncryptedEvent, OtrMessage, OtrMessageEnvelope, OtrMessageType } from '../model/messages';
import { Base64EncodedString } from '../cryptography/model';
import CryptographyService from '../cryptography';
import { EventsFilter, OtrPostResponse } from '../api/model/otr';
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
  shareAsset = async (topicId: TopicId, asset: BufferSource, metadata: AssetMetadata): Promise<OtrResult<AssetSharedResponse>> => {
    // obtain information about the conversation, prefetch data without blocking
    const preKeyBundlePromise = this.prekeyBundle(topicId);
    // encrypt asset
    const { cipherText, key, sha256 } = await this.cryptography.encryptAsset(asset);
    // request signed form data
    const uploadRequest = await this.api.getUploadFormData(cipherText.byteLength);
    // and then upload asset, do not wait on finishing as we will encrypt for users
    const assetUploadResultPromise = this.api.uploadAsset(uploadRequest, cipherText);
    // build otr message
    const assetMessage: OtrMessage = { topicId, assetId: uploadRequest.assetId, key, sha256, metadata };
    const otrMessage: OtrMessageEnvelope = { type: OtrMessageType.NEW_ASSET, data: assetMessage };
    // encrypt envelopes
    const envelopes = await this.cryptography.encryptEnvelopes(this.thisClientId, otrMessage, await preKeyBundlePromise);
    // now wait for the upload to finish, so we won't send invalid messages if it was not possible to upload the asset
    await assetUploadResultPromise;
    // and ship them!
    const otrResult = await this.api.postOtrEnvelopes(topicId, envelopes);
    // and return data
    return { otrMessage, response: { ...uploadRequest, ...otrResult } };
  };

  /**
   * Send and text message.
   * @param topicId topic where to send the message
   * @param text text message
   */
  sendText = async (topicId: TopicId, text: string): Promise<OtrResult<OtrPostResponse>> => {
    return this.sendEnvelope(topicId, { type: OtrMessageType.NEW_TEXT, data: { topicId, text } });
  };

  /**
   * Sends given envelope to the topic.
   * @param topicId topic where to send the message
   * @param otrMessage message
   */
  sendEnvelope = async (topicId: TopicId, otrMessage: OtrMessageEnvelope): Promise<OtrResult<OtrPostResponse>> => {
    const preKeyBundle = await this.prekeyBundle(topicId);
    const envelopes = await this.cryptography.encryptEnvelopes(this.thisClientId, otrMessage, preKeyBundle);
    const response = await this.api.postOtrEnvelopes(topicId, envelopes);
    return { otrMessage, response };
  };

  private prekeyBundle = async (topicId: TopicId) => this.api.getPrekeysForTopic(topicId).then(
    preKeysBundles => {
      const wholeBundle = { ...preKeysBundles.me, ...preKeysBundles.recipients };
      // TODO consider leveraging this to backend
      delete wholeBundle[this.thisClientId]; // do not encrypt for this client
      return wholeBundle;
    });

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
};
