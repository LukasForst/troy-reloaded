import { SerializedPrekey } from '../cryptography/model';
import {
  AccessToken,
  AssetUploadResult,
  ConversationMessageVisibility,
  ConversationPrekeys,
  CreateClientResponse,
  NotificationsFilter,
  OtrNotificationsBundle,
  OtrPostResult,
  Self
} from './model';
import { AssetId, ClientId, ConversationId } from '../model';
import { OtrEnvelope } from '../model/messages';

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
  registerNewClient = async (lastResortKey: SerializedPrekey, prekeys: SerializedPrekey[]): Promise<CreateClientResponse> => {
    // TODO implement this
    return Promise.reject();
  };

  /**
   * Stores prekeys in the backend
   * @param clientId ID of the client who generated the prekeys
   * @param prekeys prekeys from cryptobox to store
   */
  registerNewPrekeys = async (clientId: ClientId, prekeys: SerializedPrekey[]): Promise<void> => {
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
  getSelf = async (): Promise<Self> => {
    // TODO implement this
    return Promise.reject();
  };

  /**
   * Uploads encrypted asset to the storage and returns information about the upload.
   * @param cipherText encrypted asset.
   */
  uploadAsset = async (cipherText: Buffer): Promise<AssetUploadResult> => {
    // TODO implement this
    return Promise.reject();
  };

  /**
   * Downloads encrypted asset, returns buffer with cipher text.
   * @param assetId id of the asset to download
   */
  downloadAsset = async (assetId: AssetId): Promise<Buffer> => {
    // TODO implement this
    return Promise.reject();
  };

  /**
   * Gets all clients in the given conversation.
   *
   * Note: this method should be called when the user wants to send an OTR message.
   * @param conversationId id of the conversation
   */
  getPrekeysForConversation = async (conversationId: ConversationId): Promise<ConversationPrekeys> => {
    // TODO implement this
    return Promise.reject();
  };

  /**
   * Returns information about given conversation - what users will be able to receive a message.
   *
   * @param conversationId id of the conversation
   */
  getMessageUploadVisibilityForConversation = async (conversationId: ConversationId): Promise<ConversationMessageVisibility> => {
    // TODO implement this
    return Promise.reject();
  };

  /**
   * Sends OTR message to the system.
   * @param envelopes array or a single OTR envelope to be sent.
   */
  postOtrEnvelope = async (envelopes: OtrEnvelope[] | OtrEnvelope): Promise<OtrPostResult> => {
    if (!Array.isArray(envelopes)) {
      envelopes = [envelopes];
    }
    // TODO implement this
    return Promise.reject(envelopes);
  };

  /**
   * Gets notifications for the client according to the filter.
   * @param clientId ID of the client that requests the notifications
   * @param filter to use
   */
  getNotifications = async (
    clientId: ClientId,
    filter?: NotificationsFilter
  ): Promise<OtrNotificationsBundle> => {
    // TODO implement this
    return Promise.reject();
  };
}
