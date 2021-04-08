import { Auction, Price } from './asset.dto';

export class Order {
  from: Account;
  auction: Auction;
  price: Price;
  status: string;
  creationDate: Date;
}
