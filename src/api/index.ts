import {
  AssetUploadResult,
  ConversationMessageVisibility,
  ConversationPrekeys,
  NotificationsFilter,
  OtrNotificationsBundle,
  OtrPostResult
} from './types';
import { AssetId, ClientId, ConversationId } from '../model';
import { OtrEnvelope } from '../messaging/types';

export default class Api {
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
