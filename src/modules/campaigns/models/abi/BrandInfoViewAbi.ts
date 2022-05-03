import { BytesValue, U32Value } from '@elrondnetwork/erdjs';

import { BrandInfo } from './BrandInfoAbi';
import { MintPrice } from './MintPriceAbi';

export interface BrandInfoViewResultType {
  brand_id: BytesValue;
  brand_info: BrandInfo;
  mint_price: MintPrice;
  available_nfts: U32Value;
  total_nfts: U32Value;
}
