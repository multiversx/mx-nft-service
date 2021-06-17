import { auctionOrdersLoader } from '../orders/auction-orders.loader';
import { acountAuctionLoader } from './account-auction.loader';
import { assetAuctionLoader } from './asset-auction.loader';

export interface IGraphQLContext {
  assetAuctionLoader: ReturnType<typeof assetAuctionLoader>;
  acountAuctionLoader: ReturnType<typeof acountAuctionLoader>;
  auctionOrdersLoader: ReturnType<typeof auctionOrdersLoader>;
}
