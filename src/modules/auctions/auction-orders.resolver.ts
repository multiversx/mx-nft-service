import { Resolver, ResolveField, Parent, Args } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Auction } from './models';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import { Order, OrdersResponse } from '../orders/models';
import { OrderEntity } from 'src/db/orders';
import { AuctionsOrdersProvider } from './auction-orders.loader';
import PageResponse from '../common/filters/PageResponse';

@Resolver(() => Auction)
export class AuctionOrdersResolver extends BaseResolver(Auction) {
  constructor(private ordersProvider: AuctionsOrdersProvider) {
    super();
  }

  @ResolveField(() => OrdersResponse)
  async orders(
    @Parent() auction: Auction,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    const { limit, offset } = pagination.pagingParams();
    const { id } = auction;
    if (!id) {
      return null;
    }
    const orders = await this.ordersProvider.load(`${id}_${offset}_${limit}`);
    return PageResponse.mapResponse<Order>(
      orders
        ? orders?.map((order: OrderEntity) => Order.fromEntity(order))
        : [],
      pagination,
      orders && orders.length > 0 ? orders[0].totalCount : 0,
      offset,
      limit,
    );
  }
}
