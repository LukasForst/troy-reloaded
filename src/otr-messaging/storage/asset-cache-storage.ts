import { AssetId } from '../model';
import { TroyStorage } from './troy-storage';

export class AssetCacheStorage {

  constructor(private readonly storage: TroyStorage) {
  }

  /**
   * Stores decrypted asset in the database.
   * @param assetId ID of the asset
   * @param decryptedAsset decrypted data
   */
  cacheAsset = async (assetId: AssetId, decryptedAsset: ArrayBuffer) => this.storage.storeAssetCache({
    assetId, payload: decryptedAsset
  });

  /**
   * Returns either decrypted asset if it is in the cache or undefined.
   * @param assetId ID of the asset
   */
  getCachedAsset = async (assetId: AssetId): Promise<ArrayBuffer | undefined> => {
    const cache = await this.storage.getAssetCache(assetId);
    return cache?.payload;
  };
}
