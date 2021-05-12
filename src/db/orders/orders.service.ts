import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatusType } from './order-status.enum';
import { OrderEntity } from './order.entity';

@Injectable()
export class OrdersServiceDb {
  constructor(
    @InjectRepository(OrderEntity)
    private ordersRepository: Repository<OrderEntity>,
  ) {}

  async getActiveOrdersForAuction(auctionId: number): Promise<OrderEntity[]> {
    return await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.auction = :id and order.status=active', { id: auctionId })
      .getMany();
  }

  async saveOrder(order: OrderEntity) {
    order.status = OrderStatusType.active;
    return await this.ordersRepository.save(order);
  }

  async updateOrder(order: OrderEntity) {
    order.status = OrderStatusType.inactive;
    return await this.ordersRepository.save(order);
  }

  async deleteOrder(order: OrderEntity) {
    this.ordersRepository.delete(order);
  }
}
