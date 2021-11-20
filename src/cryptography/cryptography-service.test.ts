import { MemoryEngine } from '@wireapp/store-engine';
import { Cryptobox } from '@wireapp/cryptobox';
import { CryptographyService } from './cryptography-service';

const createService = async (name: string) => {
  const engine = new MemoryEngine();
  await engine.init(name);

  const cryptobox = new Cryptobox(engine);
  const service = new CryptographyService(cryptobox);
  return { engine, cryptobox, service };
};

test('encrypt and decrypt simple message', async () => {
  const { service: aliceService } = await createService('alice');
  const { service: bobService } = await createService('bob');

  await aliceService.createCryptobox();
  await aliceService.initCryptobox();

  await bobService.createCryptobox();
  await bobService.initCryptobox();

  const alicePlainText = 'Hello bob!';
  const aliceCipherText = await aliceService.encryptForClientsWithPreKeys(
    alicePlainText,
    { 'bob-client': bobService.getLastResortPreKey() }
  );

  const bobPlaintext = await bobService.decrypt('alice-client', aliceCipherText['bob-client']);

  console.log(`Alice: ${alicePlainText}`);
  console.log(`Bob: ${bobPlaintext}`);
});
