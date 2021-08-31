import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
  Context,
} from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { Account } from '../accounts/models/Account.dto';
import { Auction } from '../auctions/models';
import { OrdersService } from './order.service';
import { Order } from './models';
import OrdersResponse from './models/OrdersResponse';
import { FiltersExpression, Sorting } from '../filtersTypes';
import ConnectionArgs from '../ConnectionArgs';
import { connectionFromArraySlice } from 'graphql-relay';
import { IGraphQLContext } from 'src/db/auctions/graphql.types';
import { QueryRequest } from '../QueryRequest';

@Resolver(() => Order)
export class OrdersResolver extends BaseResolver(Order) {
  constructor(private ordersService: OrdersService) {
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
    const owner = new Account({
      address: ownerAddress,
    });
    return owner;
  }

  @ResolveField('auction', () => Auction)
  async auction(
    @Parent() order: Order,
    @Context()
    { auctionLoaderById: auctionLoaderById }: IGraphQLContext,
  ) {
    const { auctionId } = order;
    const auctions = await auctionLoaderById.load(auctionId);
    return auctions !== undefined ? Auction.fromEntity(auctions[0]) : null;
  }
}
