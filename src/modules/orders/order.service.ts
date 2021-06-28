import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { OrdersServiceDb } from 'src/db/orders/orders.service';
import { OrderEntity } from 'src/db/orders/order.entity';
import { CreateOrderArgs, Order } from './models';
import { Price } from '../assets/models';
import { QueryRequest } from '../QueryRequest';

@Injectable()
export class OrdersService {
  constructor(private orderServiceDb: OrdersServiceDb) {}

  async createOrder(createOrderArgs: CreateOrderArgs): Promise<Order> {
    const activeOrder = await this.orderServiceDb.getActiveOrdersForAuction(
      createOrderArgs.auctionId,
    );
    const orderEntity = await this.orderServiceDb.saveOrder(
      new OrderEntity({
        auctionId: createOrderArgs.auctionId,
        ownerAddress: createOrderArgs.ownerAddress,
        priceToken: createOrderArgs.priceToken,
        priceAmount: createOrderArgs.priceAmount,
        priceNonce: createOrderArgs.priceNonce,
      }),
    );
    if (orderEntity && activeOrder) {
      await this.orderServiceDb.updateOrder(activeOrder);
    }
    return Order.fromEntity(orderEntity);
  }

  async getOrders(queryRequest: QueryRequest): Promise<[Order[], number]> {
    const [ordersEntities, count] = await this.orderServiceDb.getOrders(
      queryRequest,
    );

    return [ordersEntities.map((order) => Order.fromEntity(order)), count];
  }

  async getTopBid(auctionId: number): Promise<Price> {
    const lastOrder = await this.orderServiceDb.getActiveOrdersForAuction(
      auctionId,
    );
    return lastOrder
      ? new Price({
          token: lastOrder?.priceToken,
          amount: lastOrder?.priceAmount,
          nonce: lastOrder?.priceNonce,
        })
      : undefined;
  }

  async getActiveOrderForAuction(auctionId: number): Promise<Order> {
    const orderEntity = await this.orderServiceDb.getActiveOrdersForAuction(
      auctionId,
    );
    return Order.fromEntity(orderEntity);
  }
}
