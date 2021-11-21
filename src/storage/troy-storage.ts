import Dexie, { Transaction } from 'dexie';
import { AssetCache, AssetDecryptionKeys, ConversationAssets, SelfData, StorageSchemata, UsersData } from './storage-schemata';
import { AssetId, ConversationId, UserId } from '../model';

/**
 * Storage repository for application data.
 */
export class TroyStorage extends Dexie {
  selfData!: Dexie.Table<SelfData, UserId>;
  usersData!: Dexie.Table<UsersData, UserId>;
  assetsData!: Dexie.Table<AssetDecryptionKeys, AssetId>;
  assetsCache!: Dexie.Table<AssetCache, AssetId>;
  conversationsData!: Dexie.Table<ConversationAssets, ConversationId>;

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
   * Get current user.
   */
  getSelf = async () => this.transaction(
    'readonly', this.selfData, async () => {
      const maybeSelf = await this.selfData.toArray();
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
  storeSelf = async (self: SelfData) => this.transaction(
    'readwrite', this.selfData, async () =>
      this.selfData.put(self, self.userId)
  );

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
   * Returns list of conversation assets sorted by time.
   */
  listConversationAssets = async (conversationId: ConversationId) => this.transaction(
    'readonly', this.conversationsData, async () =>
      this.conversationsData.where('conversationId').equals(conversationId).sortBy('time')
  );

  /**
   * Returns asset data for given asset ID.
   */
  getAsset = async (assetId: string) => this.transaction(
    'readonly', this.assetsData, async () =>
      this.assetsData.where('assetId').equals(assetId).first()
  );

  /**
   * Stores new asset in the database.
   */
  storeNewAsset = async (asset: ConversationAssets) => this.transaction(
    'readwrite', this.conversationsData, async () =>
      this.conversationsData.put(asset, asset.assetId)
  );

  /**
   * Returns asset cache for given assetId.
   */
  getAssetCache = async (assetId: string) => this.transaction(
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

}
