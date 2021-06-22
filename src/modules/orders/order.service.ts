import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { OrdersServiceDb } from 'src/db/orders/orders.service';
import { OrderEntity } from 'src/db/orders/order.entity';
import { CreateOrderArgs, Order } from './models';
import { Price } from '../assets/models';
import { FiltersExpression } from '../filtersTypes';

@Injectable()
export class OrdersService {
  constructor(private orderServiceDb: OrdersServiceDb) {}

  async createOrder(createOrderArgs: CreateOrderArgs): Promise<Order | any> {
    const activeOrder = await this.orderServiceDb.getActiveOrdersForAuction(
      createOrderArgs.auctionId,
    );
    const order = await this.orderServiceDb.saveOrder(
      new OrderEntity({
        auctionId: createOrderArgs.auctionId,
        ownerAddress: createOrderArgs.ownerAddress,
        priceToken: createOrderArgs.priceToken,
        priceAmount: createOrderArgs.priceAmount,
        priceNonce: createOrderArgs.priceNonce,
      }),
    );
    if (order && activeOrder) {
      await this.orderServiceDb.updateOrder(activeOrder);
    }
    return order;
  }

  async getOrdersForAuction(auctionId: number): Promise<Order[]> {
    const orderEntities = await this.orderServiceDb.getOrdersForAuction(
      auctionId,
    );
    let orders: Order[] = [];
    orderEntities.forEach((order) => {
      orders.push(this.mapEntityToDto(order));
    });
    return orders;
  }

  async getOrders(
    limit: number,
    offset: number,
    filters: FiltersExpression,
  ): Promise<[Order[], number]> {
    const [ordersEntities, count] = await this.orderServiceDb.getOrders(
      limit,
      offset,
      filters,
    );

    let responseOrders: Order[] = [];
    ordersEntities.forEach((order) => {
      responseOrders.push(this.mapEntityToDto(order));
    });
    return [responseOrders, count];
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

  async getActiveOrderForAuction(auctionId: number): Promise<Order | any> {
    return await this.orderServiceDb.getActiveOrdersForAuction(auctionId);
  }

  private mapEntityToDto(order: OrderEntity): Order {
    return new Order({
      id: order.id,
      ownerAddress: order.ownerAddress,
      price: new Price({
        amount: order.priceAmount,
        nonce: order.priceNonce,
        token: order.priceToken,
      }),
      status: order.status,
      creationDate: order.creationDate,
      endDate: order.modifiedDate,
      auctionId: order.auctionId,
    });
  }
}
