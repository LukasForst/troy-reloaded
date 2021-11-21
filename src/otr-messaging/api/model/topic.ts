import { ClientsPrekeyBundle } from '../../cryptography/model';

// RESPONSE: GET api/v1/topics/{topicId}/prekeys
export interface TopicPrekeysResponse {
  /**
   * List of pre keys for current user's clients.
   *
   * Note: the collection contains all clients, even the one requesting data.
   */
  me: ClientsPrekeyBundle;

  /**
   * Clients that will receive the OTR message in this topic, except for the
   * user's clients that is requesting the data - this user is in `me`.
   */
  recipients: ClientsPrekeyBundle;
}
