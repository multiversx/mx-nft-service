import { Resolver, ResolveField, Parent, Args } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { AuctionsOrdersProvider } from '.';
import { Auction } from './models';
import { Order, OrdersResponse } from '../orders/models';
import { OrderEntity } from 'src/db/orders';
import ConnectionArgs, { getPagingParameters } from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';

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
    const { limit, offset } = getPagingParameters(pagination);
    const { id } = auction;
    if (!id) {
      return null;
    }
    const orders = await this.ordersProvider.load(`${id}_${offset}_${limit}`);
    const ordersValue = orders?.value;
    return PageResponse.mapResponse<Order>(
      ordersValue ? ordersValue?.map((order: OrderEntity) => Order.fromEntity(order)) : [],
      pagination,
      ordersValue && ordersValue.length > 0 ? ordersValue[0].totalCount : 0,
      offset,
      limit,
    );
  }
}
