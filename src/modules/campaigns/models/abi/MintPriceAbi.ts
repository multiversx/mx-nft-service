import { BigUIntValue, TokenIdentifierValue } from '@elrondnetwork/erdjs';

export interface MintPrice {
  token_id: TokenIdentifierValue;
  amount: BigUIntValue;
}
