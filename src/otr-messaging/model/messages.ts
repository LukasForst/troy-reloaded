import { ClientId, EventId, OtrTime, TopicId, UserId } from './index';
import { Base64EncodedString, CipherTextBase64 } from '../cryptography/model';

// this is constructed on backend
export interface OtrEncryptedEvent {
  /**
   * ID of the event. IDs are created on the server.
   */
  eventId: EventId;
  /**
   * ID of the user who sent the message.
   */
  sendingUser: UserId;
  /**
   * Timestamp when was the event was created on the server.
   */
  createdAt: OtrTime;
  /**
   * Envelope OTR payload.
   */
  envelope: OtrEncryptedMessageEnvelope;
}

// this is constructed on client
export interface OtrEncryptedMessageEnvelope {
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
   * one should get OtrMessageEnvelope.
   */
  cipherTextPayload: CipherTextBase64;
}

/**
 * Decrypted payload from envelope.
 */
export interface OtrMessageEnvelope {
  /**
   * Type of the message. Depending on the type,
   * the message then the "data" is different.
   */
  type: OtrMessageType;

  /**
   * Payload, different depending on what is the type.
   */
  data: OtrMessage;
}

/**
 * List of possible OtrMessage that can go through system.
 */
export enum OtrMessageType {
  NEW_ASSET = 'new-asset',
  NEW_TEXT = 'new-text'
}

/**
 * Generic OTR event in OtrMessage.
 */
export type OtrMessage = TopicMessage
  | NewAssetOtrMessage
  | NewTextOtrMessage

/**
 * Event that happened in given topic.
 */
export interface TopicMessage {
  /**
   * ID of the conversation.
   */
  topicId: TopicId;
}

export interface NewTextOtrMessage extends TopicMessage {
  /**
   * Represents something written by the user.
   */
  text: string;
}

export interface NewAssetOtrMessage extends TopicMessage {
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

export interface AssetMetadata {
  /**
   * Name of the file.
   */
  fileName: string;
  /**
   * File size in bytes.
   */
  length: number;
  /**
   * File extension - such as .pdf.
   */
  fileExtension: string; // TODO maybe content type would be better?
}
