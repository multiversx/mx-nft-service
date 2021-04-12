import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { AccountsService } from './accounts.service';
import { AssetsService } from './assets.service';
import { BaseResolver } from './base.resolver';
import { Account } from './dto/account.dto';
import { Asset } from './dto/asset.dto';
import { Auction } from './dto/auction.dto';
import { Order } from './dto/order.dto';
import { NftService } from './nft.service';

@Resolver(() => Auction)
export class AuctionsResolver extends BaseResolver(Auction) {
  constructor(private nftsService: NftService) {
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
    return this.nftsService.getFullAuctionData();
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
