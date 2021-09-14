import { auctionLoaderById } from './auctionLoaderById';

export interface IGraphQLContext {
  auctionLoaderById: ReturnType<typeof auctionLoaderById>;
}
