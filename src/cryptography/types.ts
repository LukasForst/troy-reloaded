export type SessionId = string

export type ClientId = string

export type UserId = string

export type PlainText = string

export type CipherText = Uint8Array

export type CipherTextBase64 = string

export type AssetPlainText = ArrayBuffer

export type ConversationId = string

export type Base64EncodedString = string

export interface SerializedPreKey {
  /** The PreKey ID */
  id: number;
  /** The PreKey data, base64 encoded */
  key: Base64EncodedString;
}

export interface EncryptedAsset {
  cipherText: Buffer;
  key: Base64EncodedString;
  sha256: Base64EncodedString;
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


export interface OtrEnvelope {
  /**
   * Client that sent the message.
   */
  senderClientId: ClientId;
  /**
   * Receiving client.
   */
  recipientClientId: ClientId;
  /**
   * Base64 encoded encrypted payload, once decrypted
   * one should get OtrMessage.
   */
  cipherTextPayload: CipherTextBase64;
}

/**
 * List of possible OtrMessage that can go through system.
 */
export type OtrMessageType = 'new-asset'
  | 'updated-asset' // TODO fill out other types

/**
 * Decrypted payload from envelope.
 */
export interface OtrMessage {
  /**
   * Type of the message. Depending on the type,
   * the message then the "data" is different.
   */
  type: OtrMessageType;

  /**
   * Payload, different depending on what is the type.
   */
  data: OtrEvent;
}

/**
 * Generic OTR event in OtrMessage.
 */
export type OtrEvent = ConversationEvent
  | NewAssetOtrMessage

/**
 * Event that happened in conversation.
 */
export interface ConversationEvent {
  /**
   * ID of the conversation.
   */
  conversationId: ConversationId;
  /**
   * Unix timestamp, seconds from epoch. // TODO check this
   */
  timestamp: number;
}

export interface NewAssetOtrMessage extends ConversationEvent {
  /**
   * ID of the asset.
   */
  assetId: string;
  /**
   * Base64 encoded key that is used for decryption.
   */
  key: Base64EncodedString;
  /**
   * SHA256 as base64.
   */
  sha256: Base64EncodedString;

  fileName: string;
  length: number;
  fileExtension: string; // TODO maybe content type would be better?
}

