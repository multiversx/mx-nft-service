import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { AssetsService } from './assets.service';
import { BaseResolver } from './base.resolver';
import { Account } from './dto/account.dto';
import { Auction } from './dto/auction.dto';
import { Order } from './dto/order.dto';
import { NftService } from './nft.service';

@Resolver(() => Auction)
export class OrdersResolver extends BaseResolver(Order) {
  constructor(
    private assetsService: AssetsService,
    private nftsService: NftService,
  ) {
    super();
  }

  @Query(() => [Order], { name: 'orders' })
  async getOrders(@Args('orderId', { type: () => String }) orderId: string) {
    return {};
  }

  @ResolveField('from', () => Account)
  async from(@Parent() order: Order) {
    const { from } = order;
    return {};
  }

  @ResolveField('auction', () => Auction)
  async auction(@Parent() order: Order) {
    const { auction } = order;
    return {};
  }
}
