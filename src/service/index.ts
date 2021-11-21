import Api, { ApiOptions } from '../api';
import { prepareStorage } from '../storage';
import Cryptography from '../cryptography';
import CommunicationService from './communication-service';
import { CachingService } from '../storage/caching-service';
import { OtrApp } from './otr-app';

/**
 * Creates instance of OtrApp that offers all necessary logic for OTR messaging.
 *
 * Note: throws exception if the user is not logged in.
 */
export const createOtrApp = async (apiOptions?: ApiOptions) => {
  const api = new Api(undefined, apiOptions);
  // obtain access token and test if the user is logged in, this throws exception if not
  const accessToken = await api.getAccessToken();
  // TODO perform sanity checks -> do we have all necessary permissions?

  // create storage with userId as a name
  const { engine, storage } = await prepareStorage(accessToken.userId);
  // now init crypto
  const crypto = Cryptography.createWithEngine(engine);
  const initResult = await crypto.initialize();
  // if the cryptobox was created register client on backend
  if (initResult.createdNew) {
    const { clientId } = await api.registerNewClient(initResult.lastResortKey, initResult.prekeys);
    // store data about this client
    storage.storeSelf({
      userId: accessToken.userId,
      clientId,
      cryptoboxIdentity: crypto.getIdentity()
    });
  }
  const self = await storage.getSelf();
  // TODO refresh all caches (users / conversations) -> fetch them from the backend
  if (!self) {
    throw Error('It was not possible to obtain client ID!');
  }
  const communicationService = new CommunicationService(api, crypto, self.clientId);
  const cachingService = new CachingService(storage);
  return new OtrApp(self.clientId, storage, api, crypto, communicationService, cachingService);
};

export { OtrApp };
