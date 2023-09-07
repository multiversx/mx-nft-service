import { AddressValue, BigUIntValue, OptionValue, TokenIdentifierValue, U64Value } from '@multiversx/sdk-core';
import { AuctionStatusEnum } from '.';

export interface GeneralAuctionAbi {
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

export interface AuctionAbi extends GeneralAuctionAbi {
  auctioned_tokens: EsdtTokenPayment;
  payment_token: TokenIdentifierValue;
  payment_nonce: U64Value;
  min_bid_diff: BigUIntValue;
}

export interface ExternalAuctionAbi extends GeneralAuctionAbi {
  payment_token_type: TokenIdentifierValue;
  payment_token_nonce: U64Value;
  auctioned_token_type: TokenIdentifierValue;
  auctioned_token_nonce: U64Value;
  nr_auctioned_tokens: BigUIntValue;
}

export interface EsdtTokenPayment {
  token_identifier: TokenIdentifierValue;
  token_nonce: U64Value;
  amount: BigUIntValue;
}

export interface EgldOrEsdtTokenPayment {
  token_identifier: TokenIdentifierValue;
  token_nonce: U64Value;
  amount: BigUIntValue;
}

export interface OfferAbi {
  offer_token: EsdtTokenPayment;
  payment: EgldOrEsdtTokenPayment;
  start_time: U64Value;
  deadline: U64Value;
  offer_owner: AddressValue;
}
