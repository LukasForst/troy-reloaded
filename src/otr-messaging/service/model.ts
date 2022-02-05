import { OtrPostResponse } from '../api/model/otr';
import { OtrMessageEnvelope } from '../model/messages';
import { SignedAssetUpload } from '../api/model/asset';

export interface AssetSharedResponse extends OtrPostResponse, SignedAssetUpload {
}

export interface OtrResult<R extends OtrPostResponse> {
  otrMessage: OtrMessageEnvelope,
  response: R
}

