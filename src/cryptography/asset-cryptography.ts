import { EncryptedAsset } from './types';


const { crypto } = window;

/**
 * Decrypts asset.
 * @param cipherText encrypted data file
 * @param keyBytes decryption key bytes
 * @param referenceSha256 sha256 of the cipherText
 */
export const decryptAsset = async ({
                                     cipherText,
                                     keyBytes,
                                     sha256: referenceSha256
                                   }: EncryptedAsset): Promise<Buffer> => {
  const computedSha256 = await crypto.subtle.digest('SHA-256', cipherText);

  if (!isEqual(Buffer.from(computedSha256), referenceSha256)) {
    throw new Error('Encrypted asset does not match its SHA-256 hash');
  }

  const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-CBC', false, ['decrypt']);

  const initializationVector = cipherText.slice(0, 16);
  const assetCipherText = cipherText.slice(16);
  const decipher = await crypto.subtle.decrypt({ iv: initializationVector, name: 'AES-CBC' }, key, assetCipherText);

  return Buffer.from(decipher);
};

/**
 * Encrypts asset.
 */
export const encryptAsset = async (options: { plaintext: ArrayBuffer }): Promise<EncryptedAsset> => {
  const initializationVector = crypto.getRandomValues(new Uint8Array(16));
  const rawKeyBytes = crypto.getRandomValues(new Uint8Array(32));

  const key = await crypto.subtle.importKey('raw', rawKeyBytes.buffer, 'AES-CBC', true, ['encrypt']);
  const cipherText = await crypto.subtle.encrypt(
    { iv: initializationVector.buffer, name: 'AES-CBC' },
    key,
    options.plaintext
  );

  const ivCipherText = new Uint8Array(cipherText.byteLength + initializationVector.byteLength);
  ivCipherText.set(initializationVector, 0);
  ivCipherText.set(new Uint8Array(cipherText), initializationVector.byteLength);

  const computedSha256 = await crypto.subtle.digest('SHA-256', ivCipherText);
  const keyBytes = await crypto.subtle.exportKey('raw', key);

  return {
    cipherText: Buffer.from(ivCipherText.buffer),
    keyBytes: Buffer.from(keyBytes),
    sha256: Buffer.from(computedSha256)
  };
};

/**
 * Compares two buffers.
 */
const isEqual = (a: Buffer, b: Buffer): boolean => {
  const arrayA = new Uint32Array(a);
  const arrayB = new Uint32Array(b);

  const hasSameLength = arrayA.length === arrayB.length;
  const hasSameValues = arrayA.every((value, index) => value === arrayB[index]);

  return hasSameLength && hasSameValues;
};

