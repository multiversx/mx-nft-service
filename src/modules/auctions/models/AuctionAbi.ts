import {
  AddressValue,
  BigUIntValue,
  OptionValue,
  TokenIdentifierValue,
  U64Value,
} from '@elrondnetwork/erdjs';
import { AuctionStatusEnum, AuctionTypeEnum } from '.';

export interface AuctionAbi {
  auctioned_token: {
    token_type: TokenIdentifierValue;
    nonce: U64Value;
  };
  nr_auctioned_tokens: BigUIntValue;
  payment_token: {
    token_type: TokenIdentifierValue;
    nonce: U64Value;
  };
  auction_type: any;
  auction_status: AuctionStatusEnum;
  min_bid: BigUIntValue;
  max_bid: OptionValue;
  deadline: U64Value;
  start_time: U64Value;
  original_owner: AddressValue;
  current_bid: BigUIntValue;
  current_winner: AddressValue;
  marketplace_cut_percentage: BigUIntValue;
  creator_royalties_percentage: BigUIntValue;
}
