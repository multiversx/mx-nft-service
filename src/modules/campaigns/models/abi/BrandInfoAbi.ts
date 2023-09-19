import { ArrayVec, BigUIntValue, BytesValue, U64Value } from '@multiversx/sdk-core';
import { TimePeriod } from './MintPeriodAbi';

export interface BrandInfo {
  collection_hash: ArrayVec;
  token_display_name: BytesValue;
  media_type: BytesValue;
  royalties: BigUIntValue;
  mint_period: TimePeriod;
  whitelist_expire_timestamp: U64Value;
}
