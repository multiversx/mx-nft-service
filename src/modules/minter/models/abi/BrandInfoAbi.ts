import { BigUIntValue, BytesValue } from '@elrondnetwork/erdjs';

export interface BrandInfo {
  collection_id: BytesValue;
  token_display_name: BytesValue;
  media_type: BytesValue;
  royalties: BigUIntValue;
}
