import {
  AddressValue,
  BigUIntValue,
  TokenIdentifierValue,
  U64Value,
} from '@elrondnetwork/erdjs';
import { AuctionStatus } from './AuctionStatus.enum';
import { AuctionType } from './AuctionType.enum';

export interface AuctionAbi {
  auctioned_token: {
    token_type: TokenIdentifierValue;
    nonce: U64Value;
  };
  payment_token: {
    token_type: TokenIdentifierValue;
    nonce: U64Value;
  };
  auction_type: AuctionType;
  auction_status: AuctionStatus;
  min_bid: BigUIntValue;
  max_bid: BigUIntValue;
  deadline: U64Value;
  start_time: U64Value;
  original_owner: AddressValue;
  current_bid: BigUIntValue;
  current_winner: AddressValue;
  marketplace_cut_percentage: BigUIntValue;
  creator_royalties_percentage: BigUIntValue;
}
