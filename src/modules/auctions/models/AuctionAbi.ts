import {
  AddressValue,
  BigUIntValue,
  OptionValue,
  TokenIdentifierValue,
  U64Value,
} from '@elrondnetwork/erdjs';
import { ElrondNftsSwapAuctionEventEnum } from 'src/modules/assets/models';
import { AuctionStatusEnum } from '.';

export interface GeneralAuctionAbi {
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

export interface SwapAbi {
  token: EsdtToken;
  nr_tokens: BigUIntValue;
  min_bid: BigUIntValue;
  swap_type: any;
  deadline: U64Value;
  payment_token: EsdtToken;
  original_owner: AddressValue;
}

export interface OfferAbi {
  token: EsdtToken;
  nr_tokens: BigUIntValue;
  original_owner: AddressValue;
}

export interface EsdtToken {
  token_type: TokenIdentifierValue;
  nonce: U64Value;
}

export interface EsdtTokenPayment {
  token_identifier: TokenIdentifierValue;
  token_nonce: U64Value;
  amount: BigUIntValue;
}
