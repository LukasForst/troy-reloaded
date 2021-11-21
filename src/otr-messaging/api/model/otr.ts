import { EventId, OtrTime, UserId } from '../../model';
import { OtrEncryptedEvent } from '../../model/messages';


export interface EventsFilter {
  /**
   * Get all events starting on the given time.
   */
  sinceTime?: OtrTime,
  /**
   * Get all events that arrived after this event.
   */
  sinceEventId?: EventId,
  /**
   * Maximal number of events to fetch.
   */
  limit?: number;
  /**
   * Return only notifications that were not received yet.
   */
  onlyUnread?: boolean;
}

// RESPONSE: GET api/v1/events/{clientId}?filter=xxxx
export interface OtrEventsBundleResponse {
  /**
   * Indication that there are more events on the server.
   */
  hasMore: boolean;
  /**
   * Array of events that correspond to the given filter.
   */
  events: OtrEncryptedEvent[];
}

// RESPONSE: POST api/v1/topics/{topicId}
export interface OtrPostResponse {
  /**
   * ID of the event that was created.
   */
  eventId: EventId;
  /**
   * List of users that will receive the message.
   */
  usersReceiving: UserId[];
  /**
   * List of users that won't receive message as they don't have any client.
   */
  usersUnableToReceive: UserId[];
}

/**
 * Type alias as the data are the same with OtrPostResponse.
 * Note: users didn't receive anything at this point.
 */
// RESPONSE: GET api/v1/topics/{topicId}/visibility
export type OtrMessageVisibility = OtrPostResponse
