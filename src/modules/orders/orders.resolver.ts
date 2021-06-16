import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
} from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { Account } from '../accounts/models/account.dto';
import { Auction } from '../auctions/models';
import { OrdersService } from './order.service';
import { CreateOrderArgs, Order } from './models';
import OrdersResponse from './models/OrdersResponse';
import { FiltersExpression } from '../filtersTypes';
import ConnectionArgs from '../ConnectionArgs';
import { connectionFromArraySlice } from 'graphql-relay';

@Resolver(() => Order)
export class OrdersResolver extends BaseResolver(Order) {
  constructor(private ordersService: OrdersService) {
    super();
  }

  @Mutation(() => Order)
  async createOrder(@Args('input') input: CreateOrderArgs): Promise<Order> {
    return await this.ordersService.createOrder(input);
  }

  @Query(() => OrdersResponse)
  async orders(
    @Args({ name: 'filters', type: () => FiltersExpression, nullable: true })
    filters,
    @Args() args: ConnectionArgs,
  ) {
    const { limit, offset } = args.pagingParams();
    const [orders, count] = await this.ordersService.getOrders(
      limit,
      offset,
      filters,
    );
    const page = connectionFromArraySlice(orders, args, {
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
    const { from } = order;
    return {};
  }

  @ResolveField('auction', () => Auction)
  async auction(@Parent() order: Order) {
    const { auction } = order;
    return {};
  }
}
