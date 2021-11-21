import { ClientId, EventId, OtrTime, UserId } from './index';
import { OtrMessageEnvelope } from './messages';

export interface DecryptedOtrEvent {
  /**
   * ID of the event.
   */
  eventId: EventId;
  /**
   * Timestamp when was the event created on the server.
   */
  createdAt: OtrTime;
  /**
   * User that sent this event.
   */
  sendingUser: UserId;
  /**
   * Client that sent the message.
   */
  senderClientId: ClientId;
  /**
   * Receiving client.
   */
  recipientClientId: ClientId;
  /**
   * Decrypted message envelope.
   */
  otrMessageEnvelope: OtrMessageEnvelope;
}
