import { SerializedPrekey } from '../cryptography/model';
import { AssetId, ClientId, TopicId, UserId } from '../model';
import { OtrEncryptedEvent, OtrEncryptedMessageEnvelope } from '../model/messages';
import { AccessToken } from './model/access';
import { SignedAssetUpload } from './model/asset';
import { TopicPrekeysResponse } from './model/topic';
import { EventsFilter, OtrEventsBundleResponse, OtrMessageVisibility, OtrPostResponse } from './model/otr';
import { ClientDetail, UserDetail } from '../model/user';
import axios, { AxiosInstance } from 'axios';

export interface ApiOptions {
  baseUrl: string;
  websocketUrl?: string;
}

// TODO error handling
export default class Api {

  private a: AxiosInstance;
  private s?: WebSocket;

  constructor(
    private readonly options: ApiOptions,
    private accessToken?: string
  ) {
    this.a = axios.create({
      baseURL: options.baseUrl,
      timeout: 10000,
      headers: accessToken ? { 'Authorization': accessToken } : {}
    });
  }

  /**
   * Connects given listener to websocket, rejects when it was not possible to connect to the websocket.
   * @param clientId id of the current client
   * @param onEvents listener executed when new events come
   */
  connectWebsocket = async (clientId: ClientId, onEvents: ((e: OtrEncryptedEvent[]) => void)): Promise<void> => {
    // if no websocket url is set, returns false
    if (!this.options.websocketUrl) {
      return Promise.reject('No websocket url.');
    }
    // if there's no token, try to fetch it, if it fails return failure
    if (!this.accessToken) {
      await this.getAccessToken();
    }
    // previous step was not possible to finish,  we can not connect
    if (!this.s && !this.accessToken) {
      return Promise.reject('No live websocket connection or token present!');
    }
    // now create promise that resolves when the websocket connects
    return new Promise(((resolve, reject) => {
      // if there's no websocket so far create one
      if (!this.s) {
        this.s = new WebSocket(`${this.options.websocketUrl}/${clientId}/${this.accessToken}`);
        this.s.onopen = () => resolve();
        this.s.onerror = (e) => reject(e);
      }
      // finally, set onmessage event
      this.s.onmessage = (e: MessageEvent) => {
        if (e.data) {
          const events = JSON.parse(e.data) as OtrEncryptedEvent[];
          if (events) {
            onEvents(events);
          }
        }
      };
    }));
  };

  /**
   * Registers new client in the backend.
   * @param lastResortKey last key from the cryptobox that can be reused
   * @param prekeys published prekeys
   */
  registerNewClient = async (lastResortKey: SerializedPrekey, prekeys: SerializedPrekey[]): Promise<ClientDetail> => {
    // POST api/clients
    const result = await this.a.post('/clients', { lastResortKey, prekeys });
    return result.data as ClientDetail;
  };

  /**
   * Stores prekeys in the backend
   * @param clientId ID of the client who generated the prekeys
   * @param prekeys prekeys from cryptobox to store
   */
  registerNewPrekeys = async (clientId: ClientId, prekeys: SerializedPrekey[]): Promise<void> => {
    // PUT api/clients/{clientId}/prekeys
    await this.a.put(`/clients/${clientId}/prekeys`, { prekeys });
  };

  /**
   * Gets access token from the backend.
   *
   * Note: user should be already logged in with UserToken - that is stored in the cookie.
   * Note: this operation also updates Api.accessToken in this Api instance.
   */
  getAccessToken = async (): Promise<AccessToken> => {
    // POST api/access
    const result = await this.a.post(`/access`, undefined, { withCredentials: true });
    const token = result.data as AccessToken;
    // update token in this class, so we will keep it for the next time
    this.accessToken = `${token.type} ${token.token}`;
    this.a.defaults.headers.common['Authorization'] = this.accessToken;
    // and return the token instance
    return token;
  };

  /**
   * Gets information about current user.
   * Will throw exception when non 200 is returned.
   */
  getSelf = async (): Promise<UserDetail> => {
    // GET api/self
    const result = await this.a.get(`/self`);
    return result.data as UserDetail;
  };

  /**
   * Get information about users.
   */
  getUserDetails = async (userIds: UserId | UserId[]): Promise<UserDetail[]> => {
    // POST api/users
    if (!Array.isArray(userIds)) {
      userIds = [userIds];
    }

    const result = await this.a.post(`/users`, { ids: userIds });
    return result.data as UserDetail[];
  };

  /**
   *
   * @param contentLength intended file upload size
   */
  getUploadFormData = async (contentLength: number): Promise<SignedAssetUpload> => {
    // POST api/assets
    const result = await this.a.post('/assets', {
      length: contentLength
    });
    return result.data as SignedAssetUpload;
  };

  /**
   * Uploads encrypted asset to the storage and returns information about the upload.
   * @param upload parameters for the upload
   * @param cipherText encrypted asset.
   */
  uploadAsset = async (upload: SignedAssetUpload, cipherText: Buffer): Promise<any> => {
    const bodyFormData = new FormData();
    Object.keys(upload.formData).map(key => bodyFormData.append(key, upload.formData[key]));
    bodyFormData.append('file', new Blob([cipherText]), upload.assetId);
    // TODO check if it is necessary to add token/cookie or not
    return await axios.post(upload.url, bodyFormData);
  };

  /**
   * Downloads encrypted asset, returns buffer with cipher text.
   * @param assetId id of the asset to download
   */
  downloadAsset = async (assetId: AssetId): Promise<Buffer> => {
    // GET api/assets/{assetId}
    // TODO this should be optimised, but problem is that application redirects automatically and then sends bearer token
    const result = await this.a.get(`/assets/${assetId}`);
    const assetUrl = result.data['assetDownloadUrl'];
    const assetResult = await axios.get(assetUrl, { responseType: 'arraybuffer' });
    return Buffer.from(assetResult.data);
  };

  /**
   * Gets all clients prekeys in the given topic.
   *
   * Note: this method should be called when the user wants to send an OTR message.
   * @param topicId id of the conversation
   */
  getPrekeysForTopic = async (topicId: TopicId): Promise<TopicPrekeysResponse> => {
    // TODO check if get is in this context correct or not (in terms of caching)
    // GET api/topics/{topicId}/prekeys
    const result = await this.a.get(`/topics/${topicId}/prekeys`);
    return result.data as TopicPrekeysResponse;
  };

  /**
   * Returns information about what users will be able to receive a message in this topic.
   *
   * @param topicId id of the topic
   */
  getOtrMessageVisibilityForTopic = async (topicId: TopicId): Promise<OtrMessageVisibility> => {
    // GET api/topics/{topicId}/visibility
    const result = await this.a.get(`/topics/${topicId}/visibility`);
    return result.data as OtrMessageVisibility;
  };

  /**
   * Sends OTR message to the system.
   * @param topicId ID of the topic where to post the envelopes
   * @param envelopes array or a single OTR envelope to be sent
   */
  postOtrEnvelopes = async (
    topicId: TopicId, envelopes: OtrEncryptedMessageEnvelope[] | OtrEncryptedMessageEnvelope
  ): Promise<OtrPostResponse> => {
    // POST api/topics/{topicId}/otr
    if (!Array.isArray(envelopes)) {
      envelopes = [envelopes];
    }
    const result = await this.a.post(`/topics/${topicId}/otr`, { envelopes });
    return result.data as OtrPostResponse;
  };

  /**
   * Gets events for the client according to the filter.
   * @param clientId ID of the client that requests the events
   * @param filter to use
   */
  getEvents = async (
    clientId: ClientId,
    filter?: EventsFilter
  ): Promise<OtrEventsBundleResponse> => {
    // GET api/events/{clientId}?filter=xxxx
    const result = await this.a.get(`/events/${clientId}`, filter ? { params: filter } : {});
    return result.data as OtrEventsBundleResponse;
  };
}
