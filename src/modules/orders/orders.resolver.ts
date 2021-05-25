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

@Resolver(() => Order)
export class OrdersResolver extends BaseResolver(Order) {
  constructor(private orders: OrdersService) {
    super();
  }

  @Mutation(() => Order)
  async createOrder(@Args('input') input: CreateOrderArgs): Promise<Order> {
    return await this.orders.createOrder(input);
  }

  @Query(() => [Order], { name: 'order' })
  async getOrdersForAsset(
    @Args('orderId', { type: () => String }) orderId: string,
  ) {
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
