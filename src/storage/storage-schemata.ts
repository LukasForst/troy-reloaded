import type { Dexie, Transaction } from 'dexie';
import { ClientId, ConversationId, OtrTime, UserId } from '../model';
import { Base64EncodedString } from '../cryptography/types';

export interface UsersData {
  userId: UserId;
  displayName: string;
  principal: string;
  clients: ClientId[];
}

export interface AssetData {
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
      CLIENTS: 'clients',
      USERS: 'users',
      // application data
      USERS_DATA: 'usersData',
      ASSETS_DATA: 'assetsData',
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
          [StorageSchemata.OBJECT_STORE.CLIENTS]: ', meta.primary_key',
          [StorageSchemata.OBJECT_STORE.USERS]: ', id',

          [StorageSchemata.OBJECT_STORE.USERS_DATA]: 'userId, *clients',
          [StorageSchemata.OBJECT_STORE.ASSETS_DATA]: 'assetId',
          [StorageSchemata.OBJECT_STORE.CONVERSATIONS_DATA]: 'conversationId, fileName, senderId, time'
        },
        version: 0
      }
    ];
  }
}
