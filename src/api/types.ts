import { AssetId, NotificationId, OtrTime, UserId } from '../model';
import { ClientsPrekeyBundle } from '../cryptography/types';
import { OtrEnvelope } from '../messaging/types';

export interface NotificationsFilter {
  /**
   * Get all notifications starting on the given time.
   */
  sinceTime?: OtrTime,
  /**
   * Get all notifications that arrived after this notification.
   */
  sinceNotificationId?: NotificationId,
  /**
   * Maximal number of notifications to fetch.
   */
  limit?: number
}

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
  /**
   * List of users that will receive the message.
   */
  usersReceiving: UserId[];
  /**
   * List of users that won't receive message as they don't have any client.
   */
  usersUnableToReceive: UserId[];
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
  [userId: UserId]: ClientsPrekeyBundle;
}

export interface ConversationMessageVisibility {
  /**
   * List of users that will receive the message.
   */
  usersReceiving: UserId[];
  /**
   * List of users that won't receive message as they don't have any client.
   */
  usersUnableToReceive: UserId[];
}

export interface ConversationPrekeys {
  /**
   * List of pre keys for current user's clients.
   *
   * Note: the collection contains all clients, even the one requesting data.
   */
  me: ClientsPrekeyBundle;

  /**
   * Clients that will receive the OTR message in this conversation, except for the
   * user's clients that is requesting the data - this user is in `me`.
   */
  recipients: ClientsPrekeyBundle;
}
