import type { Dexie, Transaction } from 'dexie';
import { ClientId, ConversationId, OtrTime, UserId } from '../model';
import { Base64EncodedString } from '../cryptography/model';

export interface SelfData {
  userId: UserId;
  clientId: string;
  cryptoboxIdentity: string;
}

export interface UsersData {
  userId: UserId;
  displayName: string;
  principal: string;
  clients: ClientId[];
}

export interface AssetCache {
  assetId: string;
  payload?: ArrayBuffer;
}

export interface AssetDecryptionKeys {
  assetId: string;
  key: Base64EncodedString;
  sha256: Base64EncodedString;
}

export interface ConversationAssets {
  conversationId: ConversationId;
  assetId: string;
  fileName: string;
  length: string;
  fileExtension: string;
  senderId: UserId;
  time: OtrTime;
  wasDownloaded: boolean;
  usersUnableToReceive: UserId[];
  usersReceiving: UserId[];
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
      SELF: 'selfData',
      USERS_DATA: 'usersData',
      ASSETS_KEYS: 'assetsData',
      ASSETS_CACHE: 'assetsCache',
      CONVERSATIONS_DATA: 'conversationsData'
    };
  }

  static get SCHEMATA(): DexieSchema[] {
    return [
      {
        schema: {
          [StorageSchemata.OBJECT_STORE.KEYS]: '',
          [StorageSchemata.OBJECT_STORE.PRE_KEYS]: '',
          [StorageSchemata.OBJECT_STORE.SESSIONS]: '',

          [StorageSchemata.OBJECT_STORE.SELF]: '',
          [StorageSchemata.OBJECT_STORE.USERS_DATA]: 'userId, *clients',
          [StorageSchemata.OBJECT_STORE.ASSETS_KEYS]: 'assetId',
          [StorageSchemata.OBJECT_STORE.ASSETS_CACHE]: 'assetId',
          [StorageSchemata.OBJECT_STORE.CONVERSATIONS_DATA]: 'conversationId, fileName, senderId, time'
        },
        version: 0
      }
    ];
  }
}
