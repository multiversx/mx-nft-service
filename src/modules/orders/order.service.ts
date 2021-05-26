import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { OrdersServiceDb } from 'src/db/orders/orders.service';
import { OrderEntity } from 'src/db/orders/order.entity';
import { CreateOrderArgs, Order } from './models';
import { Price } from '../assets/models';

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
        priceTokenIdentifier: createOrderArgs.priceTokenIdentifier,
        priceAmount: createOrderArgs.priceAmount,
        priceNonce: createOrderArgs.priceNonce,
      }),
    );
    if (order && activeOrder) {
      await this.orderServiceDb.updateOrder(activeOrder);
    }
    return order;
  }

  async getOrdersForAuction(auctionId: number): Promise<Order[] | any> {
    return await this.orderServiceDb.getOrdersForAuction(auctionId);
  }

  async getTopBid(auctionId: number): Promise<Price> {
    const lastOrder = await this.orderServiceDb.getActiveOrdersForAuction(
      auctionId,
    );
    return lastOrder
      ? new Price({
          tokenIdentifier: lastOrder?.priceTokenIdentifier,
          amount: lastOrder?.priceAmount,
          nonce: lastOrder?.priceAmount,
        })
      : undefined;
  }

  async getActiveOrderForAuction(auctionId: number): Promise<Order | any> {
    return await this.orderServiceDb.getActiveOrdersForAuction(auctionId);
  }
}
