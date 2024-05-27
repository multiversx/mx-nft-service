import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Auction } from '../auctions/models';
import { OrdersService } from './order.service';
import { Order, OrdersResponse } from './models';
import { connectionFromArraySlice } from 'graphql-relay';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AuctionProvider } from '../auctions';
import { Account } from '../account-stats/models';
import { FiltersExpression, Sorting } from '../common/filters/filtersTypes';
import ConnectionArgs, { getPagingParameters } from '../common/filters/ConnectionArgs';
import { QueryRequest } from '../common/filters/QueryRequest';

@Resolver(() => Order)
export class OrdersResolver extends BaseResolver(Order) {
  constructor(private ordersService: OrdersService, private accountsProvider: AccountsProvider, private auctionProvider: AuctionProvider) {
    super();
  }

  @Query(() => OrdersResponse)
  async orders(
    @Args({ name: 'filters', type: () => FiltersExpression, nullable: true })
    filters,
    @Args({ name: 'sorting', type: () => [Sorting], nullable: true })
    sorting,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = getPagingParameters(pagination);
    const [orders, count] = await this.ordersService.getOrders(new QueryRequest({ limit, offset, filters, sorting }));
    const page = connectionFromArraySlice(orders, pagination, {
      arrayLength: count,
      sliceStart: offset || 0,
    });
    return {
      edges: page.edges,
      pageInfo: page.pageInfo,
      pageData: { count, limit, offset },
    };
  }

  @ResolveField('from', () => Account)
  async from(@Parent() order: Order) {
    const { ownerAddress } = order;

    if (!ownerAddress) return null;
    const account = await this.accountsProvider.load(ownerAddress);
    return Account.fromEntity(account?.value ?? null, ownerAddress);
  }

  @ResolveField('auction', () => Auction)
  async auction(@Parent() order: Order) {
    const { auctionId } = order;
    const auctions = await this.auctionProvider.load(auctionId);
    return auctions?.value !== undefined ? Auction.fromEntity(auctions.value) : null;
  }
}
