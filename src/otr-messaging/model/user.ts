import { ClientId, UserId } from './index';

export interface UserDetail {
  /**
   * ID of the user.
   */
  userId: UserId;
  /**
   * Name that should be displayed.
   */
  displayName: string;
  /**
   * Principal name / handle - identification in the system.
   */
  principalName?: string;
  /**
   * Email address of the user.
   */
  email?: string;
  /**
   * List of clients the user own.
   */
  clients: ClientDetail[];
}

export interface ClientDetail {
  /**
   * ID of the client.
   */
  clientId: ClientId;
}
