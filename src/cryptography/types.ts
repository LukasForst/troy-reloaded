export type SessionId = string

export type ClientId = string

export type PlainText = Uint8Array | string

export type CipherText = Uint8Array

export type CipherTextBase64 = string

export type PreKeyBase64Encoded = string

export interface SerializedPreKey {
  /** The PreKey ID */
  id: number;
  /** The PreKey data, base64 encoded */
  key: string;
}

export interface EncryptedAsset {
  cipherText: Buffer;
  keyBytes: Buffer;
  /** The SHA-256 sum of `cipherText` */
  sha256: Buffer;
}

export interface EncryptedAssetUploaded extends EncryptedAsset {
  key: string;
  token: string;
}

export interface ClientsPreKeyBundles {
  [clientId: ClientId]: SerializedPreKey;
}

export interface OTRClientMap {
  /** Client ID → Encrypted Payload */
  [clientId: ClientId]: CipherTextBase64;
}
