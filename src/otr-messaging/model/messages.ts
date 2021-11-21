import { ClientId, ConversationId } from './index';
import { Base64EncodedString, CipherTextBase64 } from '../cryptography/model';

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
}

export interface AssetMetadata {
  fileName: string;
  length: number;
  fileExtension: string; // TODO maybe content type would be better?
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
  /**
   * Metadata.
   */
  metadata: AssetMetadata;
}
