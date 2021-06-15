import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import FilterQueryBuilder from 'src/modules/FilterQueryBuilder';
import { FiltersExpression } from 'src/modules/filtersTypes';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { OrderStatusEnum } from '../../modules/orders/models/order-status.enum';
import { OrderEntity } from './order.entity';

@Injectable()
export class OrdersServiceDb {
  constructor(
    @InjectRepository(OrderEntity)
    private ordersRepository: Repository<OrderEntity>,
  ) {}

  async getActiveOrdersForAuction(auctionId: number): Promise<OrderEntity> {
    return await this.ordersRepository
      .createQueryBuilder('order')
      .where(`order.auctionId = :id and order.status='active'`, {
        id: auctionId,
      })
      .getOne();
  }

  async getOrdersForAuction(auctionId: number): Promise<OrderEntity[]> {
    return await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.auctionId = :id', {
        id: auctionId,
      })
      .getMany();
  }

  async getOrders(
    limit: number = 50,
    offset: number,
    filters: FiltersExpression,
  ): Promise<[OrderEntity[], number]> {
    const filterQueryBuilder = new FilterQueryBuilder<OrderEntity>(
      this.ordersRepository,
      filters,
    );
    const queryBuilder: SelectQueryBuilder<OrderEntity> =
      filterQueryBuilder.build();
    queryBuilder.offset(offset);
    queryBuilder.limit(limit);

    return await queryBuilder.getManyAndCount();
  }

  async saveOrder(order: OrderEntity) {
    order.status = OrderStatusEnum.active;
    return await this.ordersRepository.save(order);
  }

  async updateOrder(order: OrderEntity) {
    order.status = OrderStatusEnum.inactive;
    order.modifiedDate = new Date(new Date().toUTCString());
    return await this.ordersRepository.save(order);
  }
}
