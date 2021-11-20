import * as hash from 'hash.js';
// TODO this will be needed in the future, so I'm leaving it here
// noinspection JSUnusedLocalSymbols
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createSha256Hash(buffer: Buffer): Buffer {
  const hashArray = hash.sha256().update(buffer).digest();
  return Buffer.from(hashArray);
}

//
// function convertToUtf16BE(str: string): Buffer {
//   const BOMChar = '\uFEFF';
//
//   str = `${BOMChar}${str}`;
//
//   const buffer = Buffer.from(str, 'ucs2');
//
//   for (let index = 0; index < buffer.length; index += 2) {
//     const tempValue = buffer[index];
//     buffer[index] = buffer[index + 1];
//     buffer[index + 1] = tempValue;
//   }
//
//   return buffer;
// }
//
// function getAssetBytes(content: AssetContent): Buffer {
//   if (content.uploaded) {
//     const assetId = content.uploaded.assetId;
//     return convertToUtf16BE(assetId);
//   }
//   return Buffer.from([]);
// }
//
// function getTimestampBuffer(timestamp: number): Buffer {
//   const timestampBytes = Long.fromInt(timestamp).toBytesBE();
//   return Buffer.from(timestampBytes);
// }
//
// function getLocationBytes(content: LocationContent): Buffer {
//   const latitudeApproximate = Math.round(content.latitude * 1000);
//   const longitudeApproximate = Math.round(content.longitude * 1000);
//
//   const latitudeLong = Long.fromInt(latitudeApproximate).toBytesBE();
//   const longitudeLong = Long.fromInt(longitudeApproximate).toBytesBE();
//
//   const latitudeBuffer = Buffer.from(latitudeLong);
//   const longitudeBuffer = Buffer.from(longitudeLong);
//
//   return Buffer.concat([latitudeBuffer, longitudeBuffer]);
// }
//
// function getTextBytes(content: TextContent): Buffer {
//   return convertToUtf16BE(content.text);
// }
//
// function getBytes(content: ConversationContent, timestamp: number = Date.now()): Buffer {
//   let bytes: Buffer;
//
//   if (ContentType.isLocationContent(content)) {
//     bytes = getLocationBytes(content);
//   } else if (ContentType.isTextContent(content)) {
//     bytes = getTextBytes(content);
//   } else if (ContentType.isAssetContent(content)) {
//     bytes = getAssetBytes(content);
//   } else {
//     throw new Error(`Unknown message type. ${content}`);
//   }
//
//   const unixTimestamp = new Date(timestamp).getTime();
//   timestamp = Math.floor(unixTimestamp / 1e3);
//   const timestampBuffer = getTimestampBuffer(timestamp);
//
//   return Buffer.concat([bytes, timestampBuffer]);
// }
//
// export default function getHash(messageContent: AvailableMessageContent): Buffer {
//   const buffer = getBytes(messageContent);
//   return createSha256Hash(buffer);
// }
