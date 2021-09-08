import { auctionActiveOrdersLoader } from '../orders/auction-activeOrders.loader';
import { auctionOrdersLoader } from '../orders/auction-orders.loader';
import { acountAuctionLoader } from './account-auction.loader';
import { assetAuctionLoader } from './asset-auction.loader';
import { auctionLoaderById } from './auctionLoaderById';

export interface IGraphQLContext {
  assetAuctionLoader: ReturnType<typeof assetAuctionLoader>;
  auctionLoaderById: ReturnType<typeof auctionLoaderById>;
  acountAuctionLoader: ReturnType<typeof acountAuctionLoader>;
  auctionOrdersLoader: ReturnType<typeof auctionOrdersLoader>;
  auctionActiveOrdersLoader: ReturnType<typeof auctionActiveOrdersLoader>;
}
