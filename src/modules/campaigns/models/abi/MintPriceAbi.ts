import { BigUIntValue, TokenIdentifierValue } from '@multiversx/sdk-core';

export interface MintPrice {
  token_id: TokenIdentifierValue;
  amount: BigUIntValue;
}
