import {
  AddressValue,
  BigUIntValue,
  TokenIdentifierValue,
  U64Value,
} from '@elrondnetwork/erdjs';

export interface AuctionAbi {
  payment_token: {
    token_type: TokenIdentifierValue;
    nonce: U64Value;
  };
  min_bid: BigUIntValue;
  max_bid: BigUIntValue;
  deadline: U64Value;
  original_owner: AddressValue;
  current_bid: BigUIntValue;
  current_winner: AddressValue;
  marketplace_cut_percentage: BigUIntValue;
  creator_royalties_percentage: BigUIntValue;
}
