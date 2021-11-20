import { AssetId, NotificationId, OtrTime, UserId } from '../model';
import { ClientsPrekeyBundles } from '../cryptography/types';
import { OtrEnvelope } from '../messaging/types';

export interface OtrNotification {
  /**
   * ID of the notification.
   */
  notificationId: NotificationId;
  /**
   * Timestamp when was the notification created on the server.
   */
  createdAt: OtrTime;
  /**
   * Envelope OTR payload.
   */
  envelope: OtrEnvelope;
}

export interface OtrNotificationsBundle {
  /**
   * Indication that there are more notifications on the server.
   */
  hasMore: boolean;
  /**
   * Array of received notifications.
   */
  notifications: OtrNotification[];
}

export interface OtrPostResult {
  /**
   * Indication that the request was successful.
   */
  status: string;
}

export interface AssetUploadResult {
  /**
   * ID of the asset on the server.
   */
  assetId: AssetId;
}

export interface UserClientsPrekeyBundle {
  /**
   * User ids with their clients and their prekeys.
   */
  [userId: UserId]: ClientsPrekeyBundles;
}

export interface ConversationPrePost {
  /**
   * List of pre keys for current user's clients.
   *
   * Note: the collection contains all clients, even the one requesting data.
   */
  me: ClientsPrekeyBundles;

  /**
   * Users with clients that will receive the OTR message in this conversation, except for the
   * user that is requesting the data - this user is in `me`.
   */
  receivingUsers: UserClientsPrekeyBundle[];

  /**
   * Users that won't receive the OTR message as they don't have any client.
   */
  usersWithNoClients: UserId[];
}
