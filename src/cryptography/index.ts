import { Cryptobox } from '@wireapp/cryptobox';
import { providePermanentEngine } from '../storage';
import { CryptoboxWrapper } from './cryptobox-wrapper';
import { ClientsPrekeyBundles } from './types';
import { decryptAsset, encryptAsset } from './asset-cryptography';
import { ClientId } from '../model';
import { OtrEnvelope, OtrMessage } from '../messaging/types';
import { CRUDEngine } from '@wireapp/store-engine';

export default class Cryptography {

  public readonly cryptobox: Cryptobox;
  public readonly service: CryptoboxWrapper;
  /**
   * See asset-cryptography.encryptAsset
   */
  encryptAsset = encryptAsset;
  /**
   * See asset-cryptography.decryptAsset
   */
  decryptAsset = decryptAsset;

  constructor(
    private readonly engine: CRUDEngine,
    options?: { cryptobox?: Cryptobox }) {
    this.cryptobox = options?.cryptobox ?? new Cryptobox(this.engine);
    this.service = new CryptoboxWrapper(this.cryptobox);
  }

  /**
   * Create instance of this class with given storage name.
   * It creates new engine with providePermanentEngine.
   */
  public static async create(storageName: string) {
    const engine = await providePermanentEngine(storageName);
    return new Cryptography(engine);
  }

  /**
   * Create instance of this class with given engine.
   */
  public static createWithEngine(engine: CRUDEngine) {
    return new Cryptography(engine);
  }

  /**
   * Initializes cryptography services.
   */
  initialize = () => this.service.initOrCreate();

  /**
   * Serializes and encrypts given OTR message for given prekeys, creating OTR Envelopes.
   * @param sender the client that is encrypting this message
   * @param otrMessage message to be encrypted
   * @param prekeysBundle prekeys bundle that will be used to encrypt the data.
   */
  encryptToEnvelopes = async (sender: ClientId, otrMessage: OtrMessage, prekeysBundle: ClientsPrekeyBundles): Promise<OtrEnvelope[]> => {
    const plainText = JSON.stringify(otrMessage);
    const cipherText = await this.service.encryptForClientsWithPreKeys(plainText, prekeysBundle);

    return Object.keys(cipherText).map(clientId => ({
      senderClientId: sender,
      recipientClientId: clientId,
      cipherTextPayload: cipherText[clientId]
    }));
  };

  /**
   * Decrypts envelope and returns parsed JSON as OtrMessage.
   *
   * See CryptoboxWrapper.decryptFromClient.
   * @param envelope received envelope from OTR
   */
  decryptEnvelope = async (envelope: OtrEnvelope): Promise<OtrMessage> => {
    const plainText = await this.service.decryptFromClient(envelope.senderClientId, envelope.cipherTextPayload);
    return JSON.parse(plainText) as OtrMessage;
  };
}
