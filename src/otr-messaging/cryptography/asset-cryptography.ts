import { EncryptedAsset } from './model';
import { Decoder, Encoder } from 'bazinga64';


const { crypto } = window;

/**
 * Encrypts given plaintext, encrypts it and returns cipherText, sha256 and key.
 */
export const encryptAsset = async (assetPlainText: BufferSource): Promise<EncryptedAsset> => {
  const initializationVector = crypto.getRandomValues(new Uint8Array(16));
  const rawKeyBytes = crypto.getRandomValues(new Uint8Array(32));

  const key = await crypto.subtle.importKey('raw', rawKeyBytes.buffer, 'AES-CBC', true, ['encrypt']);
  const cipherText = await crypto.subtle.encrypt(
    { iv: initializationVector.buffer, name: 'AES-CBC' },
    key,
    assetPlainText
  );

  const ivCipherText = new Uint8Array(cipherText.byteLength + initializationVector.byteLength);
  ivCipherText.set(initializationVector, 0);
  ivCipherText.set(new Uint8Array(cipherText), initializationVector.byteLength);

  const computedSha256 = await crypto.subtle.digest('SHA-256', ivCipherText);
  const keyBytes = await crypto.subtle.exportKey('raw', key);

  return {
    cipherText: Buffer.from(ivCipherText.buffer),
    key: Encoder.toBase64(keyBytes).asString,
    sha256: Encoder.toBase64(computedSha256).asString
  };
};

/**
 * Decrypts asset from received data.
 * @param cipherText asset cipher text downloaded from the file storage.
 * @param key base64 encoded decryption key received as OTR message
 * @param sha256 base64 encoded sha256 received as OTR message, of the encrypted asset
 */
export const decryptAsset = async ({ cipherText, key, sha256 }: EncryptedAsset): Promise<Buffer> => {
  const computedSha256 = await crypto.subtle.digest('SHA-256', cipherText);
  const referenceSha256 = Buffer.from(Decoder.fromBase64(sha256).asBytes);
  if (!isEqual(Buffer.from(computedSha256), referenceSha256)) {
    throw new Error('Encrypted asset does not match its SHA-256 hash');
  }

  const keyBytes = Decoder.fromBase64(key).asBytes;
  const rawKey = await crypto.subtle.importKey('raw', keyBytes, 'AES-CBC', false, ['decrypt']);

  const initializationVector = cipherText.slice(0, 16);
  const assetCipherText = cipherText.slice(16);
  const decipher = await crypto.subtle.decrypt({ iv: initializationVector, name: 'AES-CBC' }, rawKey, assetCipherText);

  return Buffer.from(decipher);
};

const isEqual = (a: Buffer, b: Buffer): boolean => {
  const arrayA = new Uint32Array(a);
  const arrayB = new Uint32Array(b);

  const hasSameLength = arrayA.length === arrayB.length;
  const hasSameValues = arrayA.every((value, index) => value === arrayB[index]);

  return hasSameLength && hasSameValues;
};

