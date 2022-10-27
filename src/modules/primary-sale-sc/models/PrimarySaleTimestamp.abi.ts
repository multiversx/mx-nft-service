import { U64Type } from '@elrondnetwork/erdjs';

export interface PrimarySaleTimeAbi {
  start_sale: U64Type;
  end_sale: U64Type;
  start_claim: U64Type;
  end_claim: U64Type;
}
