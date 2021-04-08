import { Asset, Auction } from './asset.dto';
import { Order } from './order.dto';

export class Account {
  address?: string;
  profileImgUrl: string;
  username: string;
  assets: Asset[];
  orders: Order[];
  auctions: Auction[];
  followers: Account[];
  following: Account[];
}
