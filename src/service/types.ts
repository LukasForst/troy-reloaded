import { ClientId, NotificationId, OtrTime } from '../model';
import { OtrMessage } from '../messaging/types';

export interface DecryptedNotification {
  /**
   * ID of the notification.
   */
  notificationId: NotificationId;
  /**
   * Timestamp when was the notification created on the server.
   */
  createdAt: OtrTime;
  /**
   * Client that sent the message.
   */
  senderClientId: ClientId;
  /**
   * Receiving client.
   */
  recipientClientId: ClientId;
  /**
   * Decrypted message.
   */
  otrMessage: OtrMessage;
}
