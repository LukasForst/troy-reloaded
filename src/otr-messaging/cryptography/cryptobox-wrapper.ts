import { Cryptobox } from '@wireapp/cryptobox';
import { keys as ProteusKeys } from '@wireapp/proteus';
import { Decoder, Encoder } from 'bazinga64';
import {
  Base64EncodedString,
  CipherTextBase64,
  ClientsCipherTextMap,
  ClientsPrekeyBundle,
  CryptoboxInitialisation,
  PlainText,
  SerializedPrekey,
  SessionId
} from './model';
import { ClientId } from '../model';

enum TOPIC {
  NEW_PREKEYS = 'new-prekeys',
}

/**
 * Service that provides methods for encryption and decryption.
 */
export class CryptoboxWrapper {
  // TODO change this to more fancy logging
  private readonly logger = console;

  constructor(private readonly cryptobox: Cryptobox) {
  }

  /**
   * Create instance of cryptobox in the storage, this should be called when
   * the client was not used yet and the storage is empty.
   */
  createCryptobox = async (): Promise<SerializedPrekey[]> => {
    const initialPreKeys = await this.cryptobox.create();
    return this.serializeInitialKeys(initialPreKeys);
  };

  /**
   * Initialize cryptobox, tries to load data from the storage.
   * @returns SerializedPrekey[] all keys that were in the storage
   */
  initCryptobox = async (): Promise<SerializedPrekey[]> => {
    const rawKeys = await this.cryptobox.load();
    return this.serializeInitialKeys(rawKeys);
  };

  /**
   * Returns public key fingerprint.
   */
  getIdentity = (): string => this.cryptobox.getIdentity().public_key.fingerprint();

  /**
   * Register dispatcher that will be triggered when the cryptobox generates new prekeys.
   */
  registerPrekeysDispatch = (dispatch: (prekeys: SerializedPrekey[]) => any) => {
    this.cryptobox.on(TOPIC.NEW_PREKEYS, (prekeys: ProteusKeys.PreKey[]) => {
      const serializedPrekeys = prekeys.map(prekey => this.cryptobox.serialize_prekey(prekey));
      dispatch(serializedPrekeys);
    });
  };

  /**
   * Initializes cryptobox, tries to load it from the storage, if it fails,
   * initializes new one. Returns createdNew: true if it was created from scratch.
   *
   * This function should be called before accessing the cryptobox itself.
   */
  initOrCreate = async (): Promise<CryptoboxInitialisation> => {
    let prekeys;
    let createdNew = false;
    try {
      prekeys = await this.initCryptobox();
    } catch (ignored) {
      createdNew = true;
      await this.createCryptobox();
      prekeys = await this.initCryptobox();
    }

    return {
      createdNew, prekeys,
      lastResortKey: this.getLastResortPreKey()
    };
  };

  /**
   * Returns serialized last resort pre key.
   */
  getLastResortPreKey = (): SerializedPrekey => {
    if (!this.cryptobox.lastResortPreKey) {
      throw new Error('Cryptobox got initialized without a last resort PreKey.');
    }
    return this.cryptobox.serialize_prekey(this.cryptobox.lastResortPreKey);
  };

  /**
   * Encrypts given plainText with given pre keys for the users.
   * @param plainText data to encrypt
   * @param clientsPreKeyBundles clientIds to their pre keys
   * @returns ClientsCipherTextMap clientIds to base64 encoded cipher text
   */
  encryptForClientsWithPreKeys = async (
    plainText: PlainText,
    clientsPreKeyBundles: ClientsPrekeyBundle
  ): Promise<ClientsCipherTextMap> => {
    const bundles: Promise<SessionPayloadBundle>[] = [];

    // encrypt plainText using sessions
    for (const clientId of Object.keys(clientsPreKeyBundles)) {
      const preKey = clientsPreKeyBundles[clientId].key;
      const sessionId = this.clientIdToSessionId(clientId);
      bundles.push(this.encryptPayloadForSession(sessionId, plainText, preKey));
    }
    return this.mapSessionPayloadBundles(bundles);
  };

  /**
   * Decrypts cipher text for given client. When the session does not exist, cryptobox creates
   * it from the received cipher text.
   * @param clientId id of the client that sent this message
   * @param cipherText base64 encoded cipher text to decrypt
   * @returns PlainText decrypted plain text
   */
  decryptFromClient = async (clientId: ClientId, cipherText: CipherTextBase64): Promise<PlainText> =>
    this.decrypt(this.clientIdToSessionId(clientId), cipherText);

  /**
   * Decrypts cipher text for given session. When the session does not exist, cryptobox creates
   * it from the received cipher text.
   * @param sessionId id of the session that should be used for decrypting the cipherText
   * @param cipherText base64 encoded cipher text to decrypt
   * @returns PlainText decrypted plain text
   */
  decrypt = async (sessionId: SessionId, cipherText: CipherTextBase64): Promise<PlainText> => {
    this.logger.log(`Decrypting message for session ID "${sessionId}"`);
    const messageBytes = Decoder.fromBase64(cipherText).asBytes;
    const plainTextArray = await this.cryptobox.decrypt(sessionId, messageBytes.buffer);
    return Buffer.from(plainTextArray).toString('utf8');
  };

  /**
   * Resets session with sessionId. Useful when having issues with decrypting.
   */
  resetSession = async (sessionId: string): Promise<void> => {
    await this.cryptobox.session_delete(sessionId);
    this.logger.log(`Deleted session ID "${sessionId}".`);
  };

  /**
   * Encrypts given plainText with sessions for given users.
   * @param plainText data to encrypt
   * @param clients clientIds where the application has session with them
   * @returns ClientsCipherTextMap clientIds to base64 encoded cipher text
   */
  encryptWithSessionForClients = async (
    plainText: PlainText,
    clients: ClientId[]
  ): Promise<ClientsCipherTextMap> => {
    const bundles: Promise<SessionPayloadBundle>[] = [];
    // encrypt plainText using sessions
    for (const client of clients) {
      const sessionId = this.clientIdToSessionId(client);
      bundles.push(this.encryptPayloadForSession(sessionId, plainText));
    }
    return this.mapSessionPayloadBundles(bundles);
  };

  /**
   * Returns serialized keys - filters last resort key from the collection.
   */
  private serializeInitialKeys = (rawKeys: ProteusKeys.PreKey[]): SerializedPrekey[] => {
    return rawKeys.map(preKey => {
      const preKeyJson = this.cryptobox.serialize_prekey(preKey);
      if (preKeyJson.id !== ProteusKeys.PreKey.MAX_PREKEY_ID) {
        return preKeyJson;
      }
      return { id: -1, key: '' };
    })
    .filter(serializedPreKey => serializedPreKey.key);
  };

  private mapSessionPayloadBundles = async (bundles: Promise<SessionPayloadBundle>[]): Promise<ClientsCipherTextMap> => {
    // wait until plainText is encrypted for each client
    const payloads = await Promise.all(bundles);
    // map data to final object
    return payloads.reduce((recipients, payload) => {
      // get payload from cryptobox
      const { encryptedPayload, sessionId } = payload;
      // obtain clientId from session
      const clientId = this.sessionIdToClientId(sessionId);
      // encode encrypted Uint8 array to base64
      recipients[clientId] = Encoder.toBase64(encryptedPayload).asString;
      return recipients;
    }, {} as ClientsCipherTextMap);
  };

  private encryptPayloadForSession = async (
    sessionId: string,
    plainText: PlainText,
    preKey?: Base64EncodedString
  ): Promise<SessionPayloadBundle> => {
    this.logger.log(`Encrypting payload for session ID "${sessionId}"`);
    let encryptedPayload: Uint8Array;

    try {
      // pre key bundle
      const decodedPreKeyBundle = preKey
        ? Decoder.fromBase64(preKey).asBytes.buffer
        : undefined;
      // encode plainText to UTF-8 uint array
      const plainTextBuffer = new Uint8Array(Buffer.from(plainText, 'utf-8'));
      // and encrypt plaintext
      const payloadAsArrayBuffer = await this.cryptobox.encrypt(sessionId, plainTextBuffer, decodedPreKeyBundle);
      encryptedPayload = new Uint8Array(payloadAsArrayBuffer);
    } catch (error) {
      this.logger.error(`Could not encrypt payload: ${(error as Error).message}`);
      encryptedPayload = new Uint8Array(Buffer.from('💣', 'utf-8'));
    }

    return { encryptedPayload, sessionId };
  };

  // we left that here so we can change that once we will need more sophisticated mapping
  private clientIdToSessionId = (clientId: ClientId): SessionId => clientId;
  private sessionIdToClientId = (sessionId: SessionId): ClientId => sessionId;
}

// private interface for passing data between methods
interface SessionPayloadBundle {
  encryptedPayload: Uint8Array;
  sessionId: SessionId;
}

