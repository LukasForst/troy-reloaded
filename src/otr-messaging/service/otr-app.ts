import Api from '../api';
import CryptographyService from '../cryptography';
import TroyStorage, { AssetCacheStorage } from '../storage';
import CommunicationService from './communication-service';
import { AssetSharedResponse } from './model';
import { AssetId, ClientId, TopicId, UserId } from '../model';
import { AssetMetadata, NewAssetOtrMessage, OtrMessageType } from '../model/messages';
import { getFileExtension } from '../utils/file-utils';
import { AssetDecryptionKey, CurrentUserData, StoredEvent, UsersData } from '../storage/storage-schemata';

export interface OtrAppOptions {
  shouldUseCaching?: boolean;
  eventsFetchIntervalSeconds?: number;
}

/**
 * Main class used for OTR Messaging.
 */
export class OtrApp {
  /**
   * Returns list of events for given topic.
   *
   * See TroyStorage.listEventsInTopic.
   */
  listTopicEvents = this.storage.listEventsInTopic;
  private eventsFetchIntervalId?: number;
  /**
   * Returns list of events that happened in the topic and given type..
   *
   * See TroyStorage.listEventsInTopicAndType.
   */
  listEventsInTopicAndType = this.storage.listEventsInTopicAndType;
  /**
   * Returns list of users that will be able (and list of them who are unable as well)
   * to see any message posted to this topic.
   *
   * See Api.getOtrMessageVisibilityForTopic.
   */
  getOtrMessageVisibilityForTopic = this.api.getOtrMessageVisibilityForTopic;
  private onNewEventListener?: (events: StoredEvent[]) => void;
  private readonly shouldUseCaching: boolean;
  private readonly eventsFetchIntervalSeconds: number;

  constructor(
    private readonly clientId: ClientId,
    private readonly storage: TroyStorage,
    private readonly api: Api,
    private readonly cryptography: CryptographyService,
    private readonly communicationService: CommunicationService,
    private readonly cachingService: AssetCacheStorage,
    options?: OtrAppOptions
  ) {
    this.shouldUseCaching = options?.shouldUseCaching ?? true;
    this.eventsFetchIntervalSeconds = options?.eventsFetchIntervalSeconds ?? 5; // every 5s
    // when new prekeys are generated, send them to API
    cryptography.registerPrekeysDispatch(keys => api.registerNewPrekeys(clientId, keys));
  }

  /**
   * Periodically executes fetch events and stores the result
   * @param onNewEvent callback that is executed once new event is received
   */
  listen = (onNewEvent: (events: StoredEvent[]) => void) => {
    // clear any previous listeners
    if (this.eventsFetchIntervalId) {
      window.clearInterval(this.eventsFetchIntervalId);
    }
    // and start execution once again
    this.onNewEventListener = onNewEvent;
    this.eventsFetchIntervalId = window.setInterval(async () => {
      const events = await this.communicationService.fetchAllEvents(this.clientId, { onlyUnread: true });
      const eventsToStore = events.map(event => ({
        eventId: event.eventId,
        createdAt: event.createdAt,
        sendingUser: event.sendingUser,
        type: event.otrMessageEnvelope.type,
        message: event.otrMessageEnvelope.data
      } as StoredEvent));
      // store events
      await this.storage.storeEvent(eventsToStore);
      // now find events that are related to assets and extract their decryption keys
      const assetKeys = eventsToStore.filter(event => event.type === OtrMessageType.NEW_ASSET)
      .map(assetEvent => {
        const newAssetMessage = assetEvent.message as NewAssetOtrMessage;
        return {
          assetId: newAssetMessage.assetId,
          key: newAssetMessage.key,
          sha256: newAssetMessage.sha256
        } as AssetDecryptionKey;
      });
      await this.storage.storeAssetDecryptionKeys(assetKeys);
      // and dispatch information that the application saw new events
      onNewEvent(eventsToStore);
    }, this.eventsFetchIntervalSeconds * 1000);
  };

  /**
   * Share asset in the topic.
   * @param topic id of the topic where to share it.
   * @param file file from the browser
   */
  shareAsset = async (topic: TopicId, file: File): Promise<AssetSharedResponse> => {
    // read file to buffer and prepare metadata
    const arrayBuffer = await file.arrayBuffer();
    const metaData: AssetMetadata = {
      length: arrayBuffer.byteLength,
      fileName: file.name,
      fileExtension: getFileExtension(file.name)
    };
    // share the asset
    const sharedResponse = await this.communicationService.shareAsset(topic, arrayBuffer, metaData);
    // store unencrypted asset in cache
    await this.cachingService.cacheAsset(sharedResponse.assetId, arrayBuffer);
    // and return result
    return sharedResponse;
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
    const assetKeys = await this.storage.getAssetDecryptionKeys(assetId);
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
  getUser = async (userId: UserId): Promise<UsersData> => {
    let maybeUser = await this.storage.getUser(userId);
    if (!maybeUser) {
      // fetch from backend
      const userRequest = await this.api.getUserDetails(userId);
      if (!userRequest) {
        throw Error(`User ${userId} does not exist!`);
      }
      maybeUser = userRequest[0];

      // cache user
      await this.storage.storeUser(maybeUser);
    }
    return maybeUser;
  };

  /**
   * Returns information about current user.
   */
  getSelf = async (): Promise<CurrentUserData> => (await this.storage.getCurrentUser())!;
}