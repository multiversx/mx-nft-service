import { ArrayVec, BigUIntValue, BytesValue } from '@elrondnetwork/erdjs';
import { TimePeriod } from './MintPeriodAbi';

export interface BrandInfo {
  collection_hash: ArrayVec;
  token_display_name: BytesValue;
  media_type: BytesValue;
  royalties: BigUIntValue;
  mint_period: TimePeriod;
}
