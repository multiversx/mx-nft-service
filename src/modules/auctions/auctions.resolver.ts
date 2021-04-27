import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { AuctionsService } from './auctions.service';
import { BaseResolver } from '../nfts/base.resolver';
import { Account } from '../nfts/dto/account.dto';
import { Asset } from '../nfts/dto/asset.dto';
import { Auction } from '../nfts/dto/auction.dto';
import { Order } from '../nfts/dto/order.dto';

@Resolver(() => Auction)
export class AuctionsResolver extends BaseResolver(Auction) {
  constructor(private auctionsService: AuctionsService) {
    super();
  }

  @Query(() => [Auction], { name: 'auctions' })
  async getAuctions(
    @Args('auctionId', { type: () => String }) address: string,
  ) {
    return {};
  }

  @ResolveField('owner', () => Account)
  async creator(@Parent() auction: Auction) {
    const { owner } = auction;
    return {};
  }

  @ResolveField('asset', () => Asset)
  async asset(@Parent() auction: Auction) {
    const { asset } = auction;
    return {};
  }

  @ResolveField('topBidder', () => Account)
  async topBidder(@Parent() auction: Auction) {
    const { topBidder } = auction;
    return {};
  }

  @ResolveField('orders', () => [Order])
  async orders(@Parent() auction: Auction) {
    const { orders } = auction;
    return {};
  }
}
