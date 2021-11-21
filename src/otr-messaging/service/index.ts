import Api, { ApiOptions } from '../api';
import { AssetCacheStorage, prepareStorage } from '../storage';
import { createCryptographyService } from '../cryptography';
import CommunicationService from './communication-service';
import { OtrApp, OtrAppOptions } from './otr-app';
import logdown from 'logdown';

/**
 * Creates instance of OtrApp that offers all necessary logic for OTR messaging.
 *
 * Note: throws exception if the user is not logged in.
 */
const createOtrApp = async (options: { api: ApiOptions, otr?: OtrAppOptions }) => {
  const logger = logdown('createOtrApp');
  logger.log('Creating API instance.');
  const api = new Api(options.api);
  logger.log('API instance ready, getting token.');
  // obtain access token and test if the user is logged in, this throws exception if not
  const accessToken = await api.getAccessToken();
  // TODO perform sanity checks -> do we have all necessary permissions?

  logger.log('Token received!', accessToken);
  logger.log('Creating storage and engine.');
  // create storage with userId as a name
  const { engine, storage } = await prepareStorage(accessToken.userId);
  logger.log('Engine and storage created!');
  // now init crypto
  const crypto = createCryptographyService(engine);
  logger.log('Crypto created, initialising..');
  const initResult = await crypto.initialize();
  // if the cryptobox was created register client on backend
  logger.log('Crypto ready.', initResult);

  if (initResult.createdNew) {
    logger.log('Cryptobox is new, registering.');
    const { clientId } = await api.registerNewClient(initResult.lastResortKey, initResult.prekeys);
    logger.log('Registered with clientId ' + clientId);

    logger.log('Requesting data about self.');
    const remoteUser = await api.getSelf();
    logger.log('Got self', remoteUser);
    // store data about this client
    storage.storeCurrentUser({
      ...remoteUser,
      clientId,
      cryptoboxIdentity: crypto.getIdentity()
    });
  }
  logger.log('Getting current user from storage');
  const currentUser = await storage.getCurrentUser();
  // TODO refresh all caches (users / conversations) -> fetch them from the backend
  logger.log('Current user:', currentUser);
  if (!currentUser) {
    throw Error('It was not possible to obtain client ID!');
  }
  const communicationService = new CommunicationService(api, crypto, currentUser.clientId);
  const cachingService = new AssetCacheStorage(storage);
  return new OtrApp(currentUser.clientId, storage, api, crypto, communicationService, cachingService, options?.otr);
};

export { createOtrApp, CommunicationService };

export default OtrApp;
