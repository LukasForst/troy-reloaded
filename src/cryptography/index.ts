import { Cryptobox } from '@wireapp/cryptobox';
import { providePermanentEngine } from '../storage';
import { CryptographyService } from './cryptography-service';
import { ClientsPrekeyBundles } from './types';
import { decryptAsset, encryptAsset } from './asset-cryptography';
import { ClientId } from '../model';
import { OtrEnvelope, OtrMessage } from '../messaging/types';

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
    initialize: service.initOrCreate,
    decryptEnvelope: async (envelope: OtrEnvelope): Promise<OtrMessage> => {
      return service.decryptEnvelope(envelope);
    },
    encryptToEnvelopes: async (sender: ClientId, otrMessage: OtrMessage, preKeys: ClientsPrekeyBundles): Promise<OtrEnvelope[]> => {
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
