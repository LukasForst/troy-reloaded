import { AssetId } from '../../model';

// RESPONSE: POST api/v1/assets
export interface SignedAssetUpload {
  /**
   * URL of the request.
   */
  url: string;

  /**
   * ID of the asset that should be used as a file name.
   */
  assetId: AssetId;

  /**
   * Map of the key/values for form data request.
   */
  formData: { [key: string]: string };
}
