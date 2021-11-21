import { OtrPostResponse } from '../api/model/otr';
import { AssetUploadResponse } from '../api/model/asset';
import { OtrMessageEnvelope } from '../model/messages';

export interface AssetSharedResponse extends OtrPostResponse, AssetUploadResponse {
}

export interface OtrResult<R extends OtrPostResponse> {
  otrMessage: OtrMessageEnvelope,
  response: R
}

