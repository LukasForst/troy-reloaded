import type { Dexie, Transaction } from 'dexie';
import { AssetId, EventId, OtrTime, UserId } from '../model';
import { UserDetail } from '../model/user';
import { OtrMessage, OtrMessageType } from '../model/messages';
import { Base64EncodedString } from '../cryptography/model';

/**
 * Information about generic user.
 */
export type UsersData = UserDetail

export interface CurrentUserData extends UsersData {
  /**
   * Client that is stored in this web context.
   */
  clientId: string;
  /**
   * Cryptobox public key of this client.
   */
  cryptoboxIdentity: string;
}

export interface AssetCache {
  /**
   * Id of the asset.
   */
  assetId: AssetId;
  /**
   * Cache payload - decrypted file.
   */
  payload?: ArrayBuffer;
}

export interface StoredEvent {
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
   * Type of the message.
   */
  type: OtrMessageType;
  /**
   * real message with data
   */
  message: OtrMessage;
}

export interface AssetDecryptionKey {
  /**
   * ID of the asset.
   */
  assetId: AssetId;
  /**
   * Decryption key.
   */
  key: Base64EncodedString;
  /**
   * SHA
   */
  sha256: Base64EncodedString;
}


interface DexieSchema {
  schema: Record<string, string>;
  upgrade?: (transaction: Transaction, database?: Dexie) => void;
  version: number;
}

export class StorageSchemata {
  static get OBJECT_STORE() {
    return {
      // cryptobox stuff
      KEYS: 'keys',
      PRE_KEYS: 'prekeys',
      SESSIONS: 'sessions',
      // application data
      USERS_DATA: 'usersData',
      CURRENT_USER_DATA: 'currentUserData',
      ASSETS_CACHE: 'assetsCache',
      ASSETS_KEYS: 'assetsKeys',
      EVENTS: 'events'
    };
  }

  static get SCHEMATA(): DexieSchema[] {
    return [
      {
        schema: {
          [StorageSchemata.OBJECT_STORE.KEYS]: '',
          [StorageSchemata.OBJECT_STORE.PRE_KEYS]: '',
          [StorageSchemata.OBJECT_STORE.SESSIONS]: '',
          // application data
          [StorageSchemata.OBJECT_STORE.USERS_DATA]: ',userId, *clients',
          [StorageSchemata.OBJECT_STORE.CURRENT_USER_DATA]: ',userId',
          [StorageSchemata.OBJECT_STORE.ASSETS_CACHE]: ',assetId',
          [StorageSchemata.OBJECT_STORE.ASSETS_KEYS]: 'assetId',
          [StorageSchemata.OBJECT_STORE.EVENTS]: 'eventId, createdAt, sendingUser, type, message.topicId, [message.topicId+type]'
        },
        version: 1
      }
    ];
  }
}
