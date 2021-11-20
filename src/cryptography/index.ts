import { Cryptobox } from '@wireapp/cryptobox';
import { providePermanentEngine } from '../storage';
import { CryptographyService } from './cryptography-service';
import { ClientId, ClientsPreKeyBundles, OtrEnvelope, OtrMessage } from './types';
import { decryptAsset, encryptAsset } from './asset-cryptography';

/**
 * Creates instances for services necessary for performing cryptography.
 * @param name name of the store (usually id of the user)
 */
export const createCrypto = async (name: string = 'storage') => {
  const engine = await providePermanentEngine(name);
  const cryptobox = new Cryptobox(engine);
  const service = new CryptographyService(cryptobox);

  return {
    engine, cryptobox, service,
    /**
     * Initializes cryptobox, tries to load it from the storage, if it fails,
     * initializes new one. Returns isNew = true if it was created from scratch.
     *
     * This function should be called before accessing the cryptobox itself.
     */
    initialize: async () => {
      let isNew = false;
      try {
        await service.initCryptobox();
      } catch (ignored) {
        await service.createCryptobox();
        await service.initCryptobox();
        isNew = true;
      }
      return { isNew };
    },
    decryptEnvelope: async (envelope: OtrEnvelope): Promise<OtrMessage> => {
      return service.decryptEnvelope(envelope);
    },
    encryptToEnvelopes: async (sender: ClientId, otrMessage: OtrMessage, preKeys: ClientsPreKeyBundles): Promise<OtrEnvelope[]> => {
      const plainText = JSON.stringify(otrMessage);
      const cipherText = await service.encryptForClientsWithPreKeys(plainText, preKeys);

      return Object.keys(cipherText).map(clientId => ({
        senderClientId: sender,
        recipientClientId: clientId,
        cipherTextPayload: cipherText[clientId]
      }));
    },
    decryptAsset,
    encryptAsset
  };
};
