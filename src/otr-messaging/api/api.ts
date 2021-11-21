import { SerializedPrekey } from '../cryptography/model';
import { AssetId, ClientId, TopicId, UserId } from '../model';
import { OtrEncryptedMessageEnvelope } from '../model/messages';
import { AccessToken } from './model/access';
import { AssetUploadResponse } from './model/asset';
import { TopicPrekeysResponse } from './model/topic';
import { EventsFilter, OtrEventsBundleResponse, OtrMessageVisibility, OtrPostResponse } from './model/otr';
import { ClientDetail, UserDetail } from '../model/user';

export interface ApiOptions {
  backendUrl?: string;
}

export default class Api {

  constructor(
    private accessToken?: string,
    private readonly options?: ApiOptions
  ) {
  }

  /**
   * Registers new client in the backend.
   * @param lastResortKey last key from the cryptobox that can be reused
   * @param prekeys published prekeys
   */
  registerNewClient = async (lastResortKey: SerializedPrekey, prekeys: SerializedPrekey[]): Promise<ClientDetail> => {
    // POST api/v1/clients

    // TODO implement this
    return Promise.reject();
  };

  /**
   * Stores prekeys in the backend
   * @param clientId ID of the client who generated the prekeys
   * @param prekeys prekeys from cryptobox to store
   */
  registerNewPrekeys = async (clientId: ClientId, prekeys: SerializedPrekey[]): Promise<void> => {
    // PUT api/v1/clients/{clientId}/prekeys
    // TODO implement this
    return Promise.reject();
  };

  /**
   * Gets access token from the backend.
   *
   * Note: user should be already logged in with UserToken - that is stored in the cookie.
   * Note: this operation also updates Api.accessToken in this Api instance.
   */
  getAccessToken = async (): Promise<AccessToken> => {
    // POST api/v1/access

    // TODO implement this
    // obtain token
    const token = await Promise.reject<AccessToken>();
    // update token in this class so we will keep it for the next time
    this.accessToken = `${token.type} ${token.token}`;
    // and return the token instance
    return token;
  };

  /**
   * Gets information about current user.
   * Will throw exception when non 200 is returned.
   */
  getSelf = async (): Promise<UserDetail> => {
    // GET api/v1/self

    // TODO implement this
    return Promise.reject();
  };

  /**
   * Get information about users.
   */
  getUserDetails = async (userIds: UserId | UserId[]): Promise<UserDetail[]> => {
    if (!Array.isArray(userIds)) {
      userIds = [userIds];
    }
    // TODO implement this
    return Promise.reject();
  };

  /**
   * Uploads encrypted asset to the storage and returns information about the upload.
   * @param cipherText encrypted asset.
   */
  uploadAsset = async (cipherText: Buffer): Promise<AssetUploadResponse> => {
    // POST api/v1/assets

    // TODO implement this
    return Promise.reject();
  };

  /**
   * Downloads encrypted asset, returns buffer with cipher text.
   * @param assetId id of the asset to download
   */
  downloadAsset = async (assetId: AssetId): Promise<Buffer> => {
    // GET api/v1/assets/{assetId}

    // TODO implement this
    return Promise.reject();
  };

  /**
   * Gets all clients in the given topic.
   *
   * Note: this method should be called when the user wants to send an OTR message.
   * @param topicId id of the conversation
   */
  getPrekeysForTopic = async (topicId: TopicId): Promise<TopicPrekeysResponse> => {
    // TODO check if get is in this context correct or not (in terms of caching)
    // GET api/v1/topics/{topicId}/prekeys

    // TODO implement this
    return Promise.reject();
  };

  /**
   * Returns information about what users will be able to receive a message in this topic.
   *
   * @param topicId id of the topic
   */
  getOtrMessageVisibilityForTopic = async (topicId: TopicId): Promise<OtrMessageVisibility> => {
    // GET api/v1/topics/{topicId}/visibility
    // TODO implement this
    return Promise.reject();
  };

  /**
   * Sends OTR message to the system.
   * @param envelopes array or a single OTR envelope to be sent.
   */
  postOtrEnvelopes = async (envelopes: OtrEncryptedMessageEnvelope[] | OtrEncryptedMessageEnvelope): Promise<OtrPostResponse> => {
    // POST api/v1/otr

    if (!Array.isArray(envelopes)) {
      envelopes = [envelopes];
    }
    // TODO implement this
    return Promise.reject(envelopes);
  };

  /**
   * Gets events for the client according to the filter.
   * @param clientId ID of the client that requests the evetns
   * @param filter to use
   */
  getEvents = async (
    clientId: ClientId,
    filter?: EventsFilter
  ): Promise<OtrEventsBundleResponse> => {
    // GET api/v1/events/{clientId}?filter=xxxx

    // TODO implement this
    return Promise.reject();
  };
}
