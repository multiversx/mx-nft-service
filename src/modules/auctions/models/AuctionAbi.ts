import {
  AddressValue,
  BigUIntValue,
  OptionValue,
  TokenIdentifierValue,
  U64Value,
} from '@elrondnetwork/erdjs';
import { AuctionStatusEnum } from '.';

export interface AuctionAbi {
  auctioned_tokens: EsdtTokenPayment;
  payment_token: TokenIdentifierValue;
  payment_nonce: U64Value;
  auction_type: any;
  auction_status: AuctionStatusEnum;
  min_bid: BigUIntValue;
  min_bid_diff: BigUIntValue;
  max_bid: OptionValue;
  deadline: U64Value;
  start_time: U64Value;
  original_owner: AddressValue;
  current_bid: BigUIntValue;
  current_winner: AddressValue;
  marketplace_cut_percentage: BigUIntValue;
  creator_royalties_percentage: BigUIntValue;
}

export interface ExternalAuctionAbi {
  auctioned_token_type: TokenIdentifierValue;
  auctioned_token_nonce: U64Value;
  nr_auctioned_tokens: BigUIntValue;
  payment_token_type: TokenIdentifierValue;
  payment_token_nonce: U64Value;
  auction_type: any;
  auction_status: AuctionStatusEnum;
  min_bid: BigUIntValue;
  min_bid_diff: BigUIntValue;
  max_bid: OptionValue;
  deadline: U64Value;
  start_time: U64Value;
  original_owner: AddressValue;
  current_bid: BigUIntValue;
  current_winner: AddressValue;
  marketplace_cut_percentage: BigUIntValue;
  creator_royalties_percentage: BigUIntValue;
}

export interface EsdtTokenPayment {
  token_identifier: TokenIdentifierValue;
  token_nonce: U64Value;
  amount: BigUIntValue;
}
