import { auctionsByIdentifierLoader } from './auctions.loader';

export interface IGraphQLContext {
  auctionsByIdentifierLoader: ReturnType<typeof auctionsByIdentifierLoader>;
}
