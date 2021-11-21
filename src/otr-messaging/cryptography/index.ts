import CryptographyService from './cryptography-service';
import { CRUDEngine } from '@wireapp/store-engine';
import { Cryptobox } from '@wireapp/cryptobox';
import { CryptoboxWrapper } from './cryptobox-wrapper';

/**
 * Creates instance of CryptographyService and all necessary dependencies with given engine.
 * @param engine storage engine to use for data
 */
const createCryptographyService = (engine: CRUDEngine): CryptographyService => {
  const cryptobox = new Cryptobox(engine);
  const cryptoboxWrapper = new CryptoboxWrapper(cryptobox);
  return new CryptographyService(cryptoboxWrapper);
};

export { createCryptographyService, CryptoboxWrapper };

// by default expose CryptographyService
export default CryptographyService;
