import { OtrPostResponse } from '../api/model/otr';
import { AssetUploadResponse } from '../api/model/asset';

export interface AssetSharedResponse extends OtrPostResponse, AssetUploadResponse {
}
