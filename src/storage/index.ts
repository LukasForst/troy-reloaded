import { IndexedDBEngine } from '@wireapp/store-engine-dexie';
import { CRUDEngine } from '@wireapp/store-engine';
import Dexie, { Transaction } from 'dexie';
import { StorageSchemata } from './storage-schemata';

/**
 * Creates permanent storage engine.
 * @param storeName what name should be used as a primary key to get the storage
 */
export const providePermanentEngine = async (storeName: string): Promise<CRUDEngine> => {
  const db = new Dexie(storeName);
  const databaseSchemata = StorageSchemata.SCHEMATA;
  databaseSchemata.forEach(({ schema, upgrade, version }) => {
    if (upgrade) {
      return db
      .version(version)
      .stores(schema)
      .upgrade((transaction: Transaction) => upgrade(transaction, db));
    }
    return db.version(version).stores(schema);
  });
  const engine = new IndexedDBEngine();
  await engine.initWithDb(db);
  return engine;
};
