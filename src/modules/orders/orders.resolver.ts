import {
  Resolver,
  Query,
  Args,
  ResolveField,
  Parent,
  Mutation,
} from '@nestjs/graphql';
import { BaseResolver } from '../nfts/base.resolver';
import { Account } from '../nfts/dto/account.dto';
import { Auction } from '../nfts/dto/auction.dto';
import { CreateOrderArgs } from '../nfts/dto/graphqlArgs';
import { Order } from '../nfts/dto/order.dto';
import { OrdersService } from './order.service';

@Resolver(() => Order)
export class OrdersResolver extends BaseResolver(Order) {
  constructor(private orders: OrdersService) {
    super();
  }

  @Mutation(() => Order, { name: 'createOrder' })
  async createOrder(@Args() args: CreateOrderArgs): Promise<Order> {
    return await this.orders.createOrder(args);
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
