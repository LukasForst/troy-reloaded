import { CryptoboxWrapper } from './cryptobox-wrapper';
import { ClientsPrekeyBundle, SerializedPrekey } from './model';
import { decryptAsset, encryptAsset } from './asset-cryptography';
import { ClientId } from '../model';
import { OtrEnvelope, OtrMessage } from '../model/messages';


export default class CryptographyService {

  /**
   * See asset-cryptography.encryptAsset
   */
  encryptAsset = encryptAsset;
  /**
   * See asset-cryptography.decryptAsset
   */
  decryptAsset = decryptAsset;

  constructor(private readonly wrapper: CryptoboxWrapper) {
  }

  /**
   * See CryptoboxWrapper.getIdentity.
   */
  getIdentity = (): string => this.wrapper.getIdentity();

  /**
   * See CryptoboxWrapper.registerPrekeysDispatch.
   */
  registerPrekeysDispatch = (dispatch: (prekeys: SerializedPrekey[]) => any) => this.wrapper.registerPrekeysDispatch(dispatch);

  /**
   * Initializes cryptography services.
   */
  initialize = () => this.wrapper.initOrCreate();

  /**
   * Serializes and encrypts given OTR message for given prekeys, creating OTR Envelopes.
   * @param sender the client that is encrypting this message
   * @param otrMessage message to be encrypted
   * @param prekeysBundle prekeys bundle that will be used to encrypt the data.
   */
  encryptToEnvelopes = async (sender: ClientId, otrMessage: OtrMessage, prekeysBundle: ClientsPrekeyBundle): Promise<OtrEnvelope[]> => {
    const plainText = JSON.stringify(otrMessage);
    const cipherText = await this.wrapper.encryptForClientsWithPreKeys(plainText, prekeysBundle);

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
    const plainText = await this.wrapper.decryptFromClient(envelope.senderClientId, envelope.cipherTextPayload);
    return JSON.parse(plainText) as OtrMessage;
  };
}
