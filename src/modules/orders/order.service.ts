import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { CreateOrderArgs } from '../nfts/dto/graphqlArgs';
import { Order } from '../nfts/dto/order.dto';
import { OrdersServiceDb } from 'src/db/orders/orders.service';
import { OrderEntity } from 'src/db/orders/order.entity';

@Injectable()
export class OrdersService {
  constructor(private orderServiceDb: OrdersServiceDb) {}

  async createOrder(createOrderArgs: CreateOrderArgs): Promise<Order | any> {
    return await this.orderServiceDb.saveOrder(
      new OrderEntity({
        auctionId: createOrderArgs.auctionId,
        ownerAddress: createOrderArgs.ownerAddress,
        priceTokenIdentifier: createOrderArgs.priceTokenIdentifier,
        priceAmount: createOrderArgs.priceAmount,
        priceNonce: createOrderArgs.priceNonce,
      }),
    );
  }
}
