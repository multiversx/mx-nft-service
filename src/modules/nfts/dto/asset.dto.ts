import { Account } from '@elrondnetwork/erdjs/out';
import { Attribute } from './attributes.dto';
import { Order } from './order.dto';

export class Asset {
  tokenId: string;
  tokenNonce: string;
  lastSalePrice: Price;
  hash: string;
  creator: Account;
  currentOwner: Onwer;
  previousOwners: Onwer[];
  name: string;
  royalties: string; //creator percentage
  attributes: Attribute[];
  lastSale: Date;
  creationDate: Date;
  uris: string[];
  tags: string[];
}

export class Auction {
  owner: Account;
  asset: Asset;
  minBid: Price;
  maxBid: Price;
  startDate: Date;
  endDate: Date;
  topBid?: Price;
  topBidder?: Account;
  orders: Order[];
}

export class Price {
  tokenIdentifier: string;
  amount: string;
  nonce: string;
}
export class Onwer {
  account: Account;
  startDate: Date;
  endDate?: Date;
}
