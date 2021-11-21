import { UserId } from '../../model';

// POST api/v1/access
export interface AccessToken {
  /**
   * User ID who got access token.
   */
  userId: UserId;
  /**
   * When does the token expire.
   */
  expiresInSeconds: number;
  /**
   * Type of the token - usually Bearer.
   */
  type: string;
  /**
   * Encoded JWT.
   */
  token: string;
}
