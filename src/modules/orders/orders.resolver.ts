import { Resolver, Query, Args, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { Account } from '../accounts/models';
import { Auction } from '../auctions/models';
import { OrdersService } from './order.service';
import { Order, OrdersResponse } from './models';
import { FiltersExpression, Sorting } from '../filtersTypes';
import ConnectionArgs from '../ConnectionArgs';
import { connectionFromArraySlice } from 'graphql-relay';
import { QueryRequest } from '../QueryRequest';
import { AccountsProvider } from '../accounts/accounts.loader';
import { AuctionProvider } from '../auctions';

@Resolver(() => Order)
export class OrdersResolver extends BaseResolver(Order) {
  constructor(
    private ordersService: OrdersService,
    private accountsProvider: AccountsProvider,
    private auctionProvider: AuctionProvider,
  ) {
    super();
  }

  @Query(() => OrdersResponse)
  async orders(
    @Args({ name: 'filters', type: () => FiltersExpression, nullable: true })
    filters: FiltersExpression,
    @Args({ name: 'sorting', type: () => [Sorting], nullable: true })
    sorting: Sorting[],
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();
    const [orders, count] = await this.ordersService.getOrders(
      new QueryRequest({ limit, offset, filters, sorting }),
    );
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
    const account = await this.accountsProvider.getAccountByAddress(
      ownerAddress,
    );
    return Account.fromEntity(account);
  }

  @ResolveField('auction', () => Auction)
  async auction(@Parent() order: Order) {
    const { auctionId } = order;
    const auctions = await this.auctionProvider.getAuctionById(auctionId);
    return auctions !== undefined ? Auction.fromEntity(auctions[0]) : null;
  }
}
