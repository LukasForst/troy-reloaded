import { ClientId } from '../model';

/**
 * ID of the session in cryptobox.
 */
export type SessionId = string

/**
 * Plan text data - serialized JSON.
 */
export type PlainText = string

/**
 * String encoded in base64.
 */
export type Base64EncodedString = string

/**
 * Cipher text encoded in base64.
 */
export type CipherTextBase64 = Base64EncodedString

export interface SerializedPrekey {
  /**
   * ID of the prekey.
   * */
  id: number;
  /**
   * Prekey data encoded in base63.
   */
  key: Base64EncodedString;
}

export interface CryptoboxInitialisation {
  createdNew: boolean;
  lastResortKey: SerializedPrekey;
  prekeys: SerializedPrekey[];
}

export interface EncryptedAsset {
  cipherText: Buffer;
  key: Base64EncodedString;
  sha256: Base64EncodedString;
}

export interface ClientsPrekeyBundles {
  [clientId: ClientId]: SerializedPrekey;
}

export interface ClientsCipherTextMap {
  [clientId: ClientId]: CipherTextBase64;
}
