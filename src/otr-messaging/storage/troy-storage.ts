import Dexie, { Transaction } from 'dexie';
import { AssetCache, AssetDecryptionKey, CurrentUserData, StorageSchemata, StoredEvent, UsersData } from './storage-schemata';
import { AssetId, EventId, TopicId, UserId } from '../model';
import { OtrMessageType } from '../model/messages';

/**
 * Storage repository for application data.
 */
export class TroyStorage extends Dexie {
  usersData!: Dexie.Table<UsersData, UserId>;
  currentUserData!: Dexie.Table<CurrentUserData, UserId>;
  assetsCache!: Dexie.Table<AssetCache, AssetId>;
  assetsKeys!: Dexie.Table<AssetDecryptionKey, AssetId>;
  events!: Dexie.Table<StoredEvent, EventId>;

  constructor(storeName: string) {
    super(storeName);
    // migrate to latest schema
    StorageSchemata.SCHEMATA.forEach(({ schema, upgrade, version }) => {
      if (upgrade) {
        return this
        .version(version)
        .stores(schema)
        .upgrade((transaction: Transaction) => upgrade(transaction, this));
      }
      return this.version(version).stores(schema);
    });
  }

  /**
   * Finds user by user ID.
   */
  getUser = async (userId: UserId) => this.transaction(
    'readonly', this.usersData, async () =>
      this.usersData.where('userId').equals(userId).first()
  );

  /**
   * Stores new user.
   */
  storeUser = async (user: UsersData) => this.transaction(
    'readwrite', this.usersData, async () =>
      this.usersData.put(user, user.userId)
  );

  /**
   * Get current user.
   */
  getCurrentUser = async () => this.transaction(
    'readonly', this.currentUserData, async () => {
      const maybeSelf = await this.currentUserData.toArray();
      if (maybeSelf && maybeSelf.length !== 0) {
        return maybeSelf[0];
      } else {
        return undefined;
      }
    }
  );

  /**
   * Store current user in the database.
   */
  storeCurrentUser = async (user: CurrentUserData) => this.transaction(
    'readwrite', this.currentUserData, async () =>
      this.currentUserData.put(user, user.userId)
  );


  /**
   * Returns asset cache for given assetId.
   */
  getAssetCache = async (assetId: AssetId) => this.transaction(
    'readonly', this.assetsCache, async () =>
      this.assetsCache.where('assetId').equals(assetId).first()
  );

  /**
   * Stores asset cache in database.
   */
  storeAssetCache = async (asset: AssetCache) => this.transaction(
    'readwrite', this.assetsCache, async () =>
      this.assetsCache.put(asset, asset.assetId)
  );

  /**
   * Returns decryption keys for given asset ID.
   */
  getAssetDecryptionKeys = async (assetId: AssetId) => this.transaction(
    'readonly', this.assetsKeys, async () =>
      this.assetsKeys.where('assetId').equals(assetId).first()
  );

  /**
   * Stores decryption keys in database.
   */
  storeAssetDecryptionKeys = async (assetKey: AssetDecryptionKey | AssetDecryptionKey[]) => this.transaction(
    'readwrite', this.assetsKeys, async () => {
      if (!Array.isArray(assetKey)) {
        assetKey = [assetKey];
      }
      assetKey.forEach(k => {
        this.assetsKeys.put(k, k.assetId);
      });
    }
  );

  /**
   * Returns list of events for given topic.
   */
  listEventsInTopic = async (
    topic: TopicId,
    limit?: number,
    offset: number = 0
  ) => this.transaction(
    'readonly', this.events, async () => {
      let query = this.events.where('message.topicId').equals(topic).offset(offset);
      if (limit !== undefined) {
        query = query.limit(limit);
      }
      return query.sortBy('createdAt');
    }
  );

  /**
   * Returns list of events for given topic and type.
   */
  listEventsInTopicAndType = async (
    topic: TopicId,
    type: OtrMessageType,
    limit?: number,
    offset: number = 0
  ) => this.transaction(
    'readonly', this.events, async () => {
      let query = this.events.where('[type+message.topicId]').equals([type, topic]).offset(offset);
      if (limit !== undefined) {
        query = query.limit(limit);
      }
      return query.sortBy('createdAt');
    }
  );

  /**
   * Stores events in database.
   */
  storeEvent = async (events: StoredEvent | StoredEvent[]) => {
    this.transaction('readwrite', this.events, async () => {
        if (!Array.isArray(events)) {
          events = [events];
        }
        events.forEach(e => {
          this.events.put(e, e.eventId);
        });
      }
    );
  };
}
