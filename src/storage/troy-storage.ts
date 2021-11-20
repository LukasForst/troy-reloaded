import Dexie, { Transaction } from 'dexie';
import { AssetData, ConversationAssets, StorageSchemata, UsersData } from './storage-schemata';
import { ConversationId, UserId } from '../model';

/**
 * Storage repository for application data.
 */
export class TroyStorage extends Dexie {
  usersData!: Dexie.Table<UsersData, UserId>;
  assetsData!: Dexie.Table<AssetData, string>;
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
      this.usersData.put(user)
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
      this.conversationsData.put(asset)
  );
}
