import { AssetId } from '../../model';

// RESPONSE: POST api/v1/assets
export interface AssetUploadResponse {
  /**
   * ID of the asset on the server.
   */
  assetId: AssetId;
}
