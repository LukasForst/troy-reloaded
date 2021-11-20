import { Cryptobox } from '@wireapp/cryptobox';
import { keys as ProteusKeys } from '@wireapp/proteus';
import { Decoder, Encoder } from 'bazinga64';
import {
  Base64EncodedString,
  CipherTextBase64,
  ClientId,
  ClientsPreKeyBundles,
  OTRClientMap,
  OtrEnvelope,
  OtrMessage,
  PlainText,
  SerializedPreKey,
  SessionId
} from './types';

// private interface for passing data between methods
interface SessionPayloadBundle {
  encryptedPayload: Uint8Array;
  sessionId: SessionId;
}

/**
 * Service that provides methods for encryption and decryption.
 */
export class CryptographyService {
  // TODO change this to more fancy logging
  private readonly logger = console;

  constructor(
    private readonly cryptobox: Cryptobox
  ) {
  }

  /**
   * Create instance of cryptobox in the storage, this should be called when
   * the client was not used yet and the storage is empty.
   */
  public async createCryptobox(): Promise<SerializedPreKey[]> {
    const initialPreKeys = await this.cryptobox.create();
    return initialPreKeys.map(preKey => {
      const preKeyJson = this.cryptobox.serialize_prekey(preKey);
      if (preKeyJson.id !== ProteusKeys.PreKey.MAX_PREKEY_ID) {
        return preKeyJson;
      }
      return { id: -1, key: '' };
    })
    .filter(serializedPreKey => serializedPreKey.key);
  }

  /**
   * Returns serialized last resort pre key.
   */
  public getLastResortPreKey(): SerializedPreKey {
    if (!this.cryptobox.lastResortPreKey) {
      throw new Error('Cryptobox got initialized without a last resort PreKey.');
    }
    return this.cryptobox.serialize_prekey(this.cryptobox.lastResortPreKey);
  }

  /**
   * Decrypts envelope and returns parsed JSON as OtrMessage.
   *
   * When the session does not exist, cryptobox creates it from the received cipher text.
   * @param envelope received envelope from OTR
   */
  public async decryptEnvelope(envelope: OtrEnvelope): Promise<OtrMessage> {
    const sessionId = this.clientIdToSessionId(envelope.senderClientId);
    const plainText = await this.decrypt(sessionId, envelope.cipherTextPayload);
    return JSON.parse(plainText) as OtrMessage;
  }

  /**
   * Encrypts given plainText with sessions for given users.
   * @param plainText data to encrypt
   * @param clients clientIds where the application has session with them
   * @returns OTRClientMap clientIds to base64 encoded cipher text
   */
  public async encryptWithSessionForClients(
    plainText: PlainText,
    clients: ClientId[]
  ): Promise<OTRClientMap> {
    const bundles: Promise<SessionPayloadBundle>[] = [];
    // encrypt plainText using sessions
    for (const client of clients) {
      const sessionId = this.clientIdToSessionId(client);
      bundles.push(this.encryptPayloadForSession(sessionId, plainText));
    }
    return this.mapSessionPayloadBundles(bundles);
  }

  /**
   * Encrypts given plainText with given pre keys for the users.
   * @param plainText data to encrypt
   * @param clientsPreKeyBundles clientIds to their pre keys
   * @returns OTRClientMap clientIds to base64 encoded cipher text
   */
  public async encryptForClientsWithPreKeys(
    plainText: PlainText,
    clientsPreKeyBundles: ClientsPreKeyBundles
  ): Promise<OTRClientMap> {
    const bundles: Promise<SessionPayloadBundle>[] = [];

    // encrypt plainText using sessions
    for (const clientId of Object.keys(clientsPreKeyBundles)) {
      const preKey = clientsPreKeyBundles[clientId].key;
      const sessionId = this.clientIdToSessionId(clientId);
      bundles.push(this.encryptPayloadForSession(sessionId, plainText, preKey));
    }
    return this.mapSessionPayloadBundles(bundles);
  }

  /**
   * Initialize cryptobox, tries to load data from the storage.
   */
  public async initCryptobox(): Promise<ProteusKeys.PreKey[]> {
    return await this.cryptobox.load();
  }

  /**
   * Resets session with sessionId. Useful when having issues with decrypting.
   */
  public async resetSession(sessionId: string): Promise<void> {
    await this.cryptobox.session_delete(sessionId);
    this.logger.log(`Deleted session ID "${sessionId}".`);
  }

  /**
   * Decrypts cipher text for given session. When the session does not exist, cryptobox creates
   * it from the received cipher text.
   * @param sessionId id of the session that should be used for decrypting the cipherText
   * @param cipherText base64 encoded cipher text to decrypt
   * @returns PlainText decrypted plain text
   */
  public async decrypt(sessionId: SessionId, cipherText: CipherTextBase64): Promise<PlainText> {
    this.logger.log(`Decrypting message for session ID "${sessionId}"`);
    const messageBytes = Decoder.fromBase64(cipherText).asBytes;
    const plainTextArray = await this.cryptobox.decrypt(sessionId, messageBytes.buffer);
    return Buffer.from(plainTextArray).toString('utf8');
  }

  private async mapSessionPayloadBundles(bundles: Promise<SessionPayloadBundle>[]): Promise<OTRClientMap> {
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
    }, {} as OTRClientMap);
  }

  private async encryptPayloadForSession(
    sessionId: string,
    plainText: PlainText,
    preKey?: Base64EncodedString
  ): Promise<SessionPayloadBundle> {
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
  }

  // we left that here so we can change that once we will need more sophisticated mapping
  private clientIdToSessionId = (clientId: ClientId): SessionId => clientId;
  private sessionIdToClientId = (sessionId: SessionId): ClientId => sessionId;
}