/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import type { Dexie, Transaction } from 'dexie';

interface DexieSchema {
  schema: Record<string, string>;
  upgrade?: (transaction: Transaction, database?: Dexie) => void;
  version: number;
}

export class StorageSchemata {
  static get OBJECT_STORE() {
    return {
      AMPLIFY: 'amplify',
      CLIENTS: 'clients',
      CONVERSATIONS: 'conversations',
      CONVERSATION_EVENTS: 'conversation_events',
      EVENTS: 'events',
      KEYS: 'keys',
      PRE_KEYS: 'prekeys',
      SESSIONS: 'sessions',
      USERS: 'users'
    };
  }

  static get SCHEMATA(): DexieSchema[] {
    return [
      {
        schema: {
          [StorageSchemata.OBJECT_STORE.AMPLIFY]: '',
          [StorageSchemata.OBJECT_STORE.CLIENTS]: ', meta.primary_key',
          [StorageSchemata.OBJECT_STORE.CONVERSATION_EVENTS]:
            ', category, conversation, time, type, [conversation+time], [conversation+category]',
          [StorageSchemata.OBJECT_STORE.CONVERSATIONS]: ', id, last_event_timestamp',
          [StorageSchemata.OBJECT_STORE.EVENTS]:
            '++primary_key, id, category, conversation, time, type, [conversation+time], [conversation+category]',
          [StorageSchemata.OBJECT_STORE.KEYS]: '',
          [StorageSchemata.OBJECT_STORE.PRE_KEYS]: '',
          [StorageSchemata.OBJECT_STORE.SESSIONS]: '',
          [StorageSchemata.OBJECT_STORE.USERS]: ', id'
        },
        version: 15
      },
      {
        schema: {},
        version: 16
      }
    ];
  }
}
