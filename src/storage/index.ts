import { IndexedDBEngine } from '@wireapp/store-engine-dexie';
import { CRUDEngine } from '@wireapp/store-engine';
import { TroyStorage } from './troy-storage';


/**
 * Creates permanent storage engine.
 * @param storeName what name should be used as a primary key to get the storage
 */
export const prepareStorage = async (storeName: string): Promise<{ engine: CRUDEngine, storage: TroyStorage }> => {
  const storage = new TroyStorage(storeName);
  const engine = new IndexedDBEngine();
  await engine.initWithDb(storage);
  return { engine, storage };
};
