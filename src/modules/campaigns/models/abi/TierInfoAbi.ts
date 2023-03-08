import { BytesValue, U32Value } from '@multiversx/sdk-core';
import { MintPrice } from './MintPriceAbi';

export interface TierInfoAbi {
  tier: BytesValue;
  total_nfts: U32Value;
  available_nfts: U32Value;
  mint_price: MintPrice;
}
