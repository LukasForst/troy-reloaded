import Api, { ApiOptions } from '../api';
import Cryptography from '../cryptography';
import { TroyStorage } from '../storage/troy-storage';
import { prepareStorage } from '../storage';
import CommunicationService from './communication-service';
import { DecryptedNotification } from './types';
import { AssetId, ClientId, ConversationId, UserId } from '../model';
import { AssetMetadata } from '../model/messages';
import { getFileExtension } from '../utils/fileUtils';
import { CachingService } from '../storage/caching-service';
import { OtrPostResult } from '../api/types';
import { ConversationAssets, SelfData, UsersData } from '../storage/storage-schemata';


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


export class OtrApp {
  private onNewEventListener?: (events: DecryptedNotification[]) => void;
  private eventsFetchIntervalId?: number;

  constructor(
    private readonly clientId: ClientId,
    private readonly storage: TroyStorage,
    private readonly api: Api,
    private readonly cryptography: Cryptography,
    private readonly communicationService: CommunicationService,
    private readonly cachingService: CachingService,
    private readonly options?: any
  ) {
    // when new prekeys are generated, send them to API
    cryptography.registerPrekeysDispatch(keys => api.registerNewPrekeys(clientId, keys));
  }

  /**
   * Periodically executes fetch notifications and stores the result
   * @param onNewEvent callback that is executed once new event is received
   */
  listen = (onNewEvent: (events: DecryptedNotification[]) => void) => {
    // clear any previous listeners
    if (this.eventsFetchIntervalId) {
      window.clearInterval(this.eventsFetchIntervalId);
    }
    // and start execution once again
    this.onNewEventListener = onNewEvent;
    this.eventsFetchIntervalId = window.setInterval(async () => {
      const notifications = await this.communicationService.fetchAllNotifications();
      // TODO store the notifications
      onNewEvent(notifications);
    }, 5000);
  };

  /**
   * Returns list of events that happened in the conversation.
   * @param conversationId conversation to list
   */
  listConversationEvents = async (conversationId: ConversationId): Promise<ConversationAssets[]> =>
    this.storage.listConversationAssets(conversationId);

  /**
   * Share asset in the conversation.
   * @param conversationId id of the conversation where to post it.
   * @param file file from the browser
   */
  shareAsset = async (conversationId: ConversationId, file: File): Promise<OtrPostResult> => {
    // read file to buffer and prepare metadata
    const arrayBuffer = await file.arrayBuffer();
    const metaData: AssetMetadata = {
      length: arrayBuffer.byteLength,
      fileName: file.name,
      fileExtension: getFileExtension(file.name)
    };
    // share the asset
    const { asset, otr } = await this.communicationService.shareAsset(conversationId, arrayBuffer, metaData);
    // store unencrypted asset in cache
    await this.cachingService.cacheAsset(asset.assetId, arrayBuffer);
    // and return result
    return otr;
  };

  /**
   * Fetches and decrypts asset - uses caching.
   * @param assetId assetId to fetch
   */
  getAsset = async (assetId: AssetId): Promise<Blob> => {
    const cachedResponse = await this.cachingService.getCachedAsset(assetId);
    if (cachedResponse) {
      return new Blob([cachedResponse]);
    }
    const assetKeys = await this.storage.getAsset(assetId);
    if (!assetKeys) {
      throw Error(`Asset ${assetId} was not found in the database!`);
    }
    const asset = await this.communicationService.downloadAsset(assetId, assetKeys.key, assetKeys.sha256);
    // cache asset
    this.cachingService.cacheAsset(assetId, asset);
    // and return it back to client
    return new Blob([asset]);
  };

  /**
   * Obtain information about given user.
   * @param userId ID of the user
   */
  getUserInformation = async (userId: UserId): Promise<UsersData> => {
    const maybeUser = await this.storage.getUser(userId);
    if (!maybeUser) {
      // TODO maybe try to fetch it from backend?
      throw Error(`User ${userId} not found in the database!`);
    }
    return maybeUser;
  };

  /**
   * Returns information about current user.
   */
  getSelf = async (): Promise<SelfData> => (await this.storage.getSelf())!;
}
