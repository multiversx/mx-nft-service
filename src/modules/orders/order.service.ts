import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { OrdersServiceDb } from 'src/db/orders/orders.service';
import { OrderEntity } from 'src/db/orders/order.entity';
import { CreateOrderArgs, Order } from './models';

@Injectable()
export class OrdersService {
  constructor(private orderServiceDb: OrdersServiceDb) {}

  async createOrder(createOrderArgs: CreateOrderArgs): Promise<Order | any> {
    const activeOrders = await this.orderServiceDb.getActiveOrdersForAuction(
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
    if (order && activeOrders) {
      await this.orderServiceDb.updateOrder(activeOrders[0]);
    }
    return order;
  }
  async getOrdersForAuction(auctionId: number): Promise<Order[] | any> {
    return await this.orderServiceDb.getOrdersForAuction(auctionId);
  }
}
