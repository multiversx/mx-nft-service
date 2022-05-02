import { BigUIntValue, BytesValue } from '@elrondnetwork/erdjs';

export interface BrandInfo {
  collection_hash: BytesValue;
  token_display_name: BytesValue;
  media_type: BytesValue;
  royalties: BigUIntValue;
}
