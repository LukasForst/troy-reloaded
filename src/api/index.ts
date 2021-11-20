// noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols

import { AssetUploadResult, ConversationPrePost, OtrNotificationsBundle, OtrPostResult } from './types';
import { AssetId, ClientId, ConversationId, NotificationId, OtrTime } from '../model';
import { OtrEnvelope } from '../messaging/types';

/**
 * Uploads encrypted asset to the storage and returns information about the upload.
 * @param cipherText encrypted asset.
 */
export const uploadAsset = async (cipherText: Buffer): Promise<AssetUploadResult> => {
  // TODO implement this
  return Promise.reject();
};

/**
 * Downloads encrypted asset, returns buffer with cipher text.
 * @param assetId id of the asset to download
 */
export const downloadAsset = async (assetId: AssetId): Promise<Buffer> => {
  // TODO implement this
  return Promise.reject();
};

/**
 * Returns information about given conversation - including pre keys for clients.
 *
 * Note: this method should be called when the user wants to send an OTR message.
 * @param conversationId id of the conversation
 */
export const getConversationPrePost = async (conversationId: ConversationId): Promise<ConversationPrePost> => {
  // TODO implement this
  return Promise.reject();
};

/**
 * Sends OTR message to the system.
 * @param envelopes array or a single OTR envelope to be sent.
 */
export const postOtrEnvelope = async (envelopes: OtrEnvelope[] | OtrEnvelope): Promise<OtrPostResult> => {
  if (!Array.isArray(envelopes)) {
    envelopes = [envelopes];
  }
  // TODO implement this
  return Promise.reject(envelopes);
};

/**
 * Gets notifications for the client according to the filter.
 * @param clientId ID of the client that requests the notifications
 * @param filter sinceTime - get all notifications starting on the given time,
 * sinceNotificationId - get all notifications that arrived after this notification
 * limit - maximal number of notifications to fetch
 */
export const getNotificationsSinceTime = async (
  clientId: ClientId,
  filter?: { sinceTime?: OtrTime, sinceNotificationId?: NotificationId, limit?: number }
): Promise<OtrNotificationsBundle> => {
  // TODO implement this
  return Promise.reject();
};
