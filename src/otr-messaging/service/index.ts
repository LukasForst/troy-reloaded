import Api, { ApiOptions } from '../api';
import { AssetCacheStorage, prepareStorage } from '../storage';
import { createCryptographyService } from '../cryptography';
import CommunicationService from './communication-service';
import { OtrApp, OtrAppOptions } from './otr-app';

/**
 * Creates instance of OtrApp that offers all necessary logic for OTR messaging.
 *
 * Note: throws exception if the user is not logged in.
 */
const createOtrApp = async (options?: { api?: ApiOptions, otr?: OtrAppOptions }) => {
  const api = new Api(undefined, options?.api);
  // obtain access token and test if the user is logged in, this throws exception if not
  const accessToken = await api.getAccessToken();
  // TODO perform sanity checks -> do we have all necessary permissions?

  // create storage with userId as a name
  const { engine, storage } = await prepareStorage(accessToken.userId);
  // now init crypto
  const crypto = createCryptographyService(engine);
  const initResult = await crypto.initialize();
  // if the cryptobox was created register client on backend
  if (initResult.createdNew) {
    const { clientId } = await api.registerNewClient(initResult.lastResortKey, initResult.prekeys);
    const remoteUser = await api.getSelf();
    // store data about this client
    storage.storeCurrentUser({
      ...remoteUser,
      clientId,
      cryptoboxIdentity: crypto.getIdentity()
    });
  }
  const currentUser = await storage.getCurrentUser();
  // TODO refresh all caches (users / conversations) -> fetch them from the backend
  if (!currentUser) {
    throw Error('It was not possible to obtain client ID!');
  }
  const communicationService = new CommunicationService(api, crypto, currentUser.clientId);
  const cachingService = new AssetCacheStorage(storage);
  return new OtrApp(currentUser.clientId, storage, api, crypto, communicationService, cachingService, options?.otr);
};

export { createOtrApp, CommunicationService };

export default OtrApp;
