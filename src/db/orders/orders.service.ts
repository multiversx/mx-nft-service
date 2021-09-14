import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import FilterQueryBuilder from 'src/modules/FilterQueryBuilder';
import { Sort, Sorting } from 'src/modules/filtersTypes';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { OrderStatusEnum } from '../../modules/orders/models/order-status.enum';
import { QueryRequest } from '../../modules/QueryRequest';
import { OrderEntity } from './order.entity';
import { OrdersProvider } from './orders.loader';

@Injectable()
export class OrdersServiceDb {
  constructor(
    private ordersLoader: OrdersProvider,
    @InjectRepository(OrderEntity)
    private ordersRepository: Repository<OrderEntity>,
  ) {}

  async getActiveOrderForAuction(auctionId: number): Promise<OrderEntity> {
    return await this.ordersRepository
      .createQueryBuilder('order')
      .where(`order.auctionId = :id and order.status='active'`, {
        id: auctionId,
      })
      .getOne();
  }

  async getActiveOrdersForAuction(auctionId: number): Promise<OrderEntity[]> {
    return await this.ordersRepository
      .createQueryBuilder('order')
      .where(`order.auctionId = :id and order.status='active'`, {
        id: auctionId,
      })
      .getMany();
  }

  async getOrders(
    queryRequest: QueryRequest,
  ): Promise<[OrderEntity[], number]> {
    const filterQueryBuilder = new FilterQueryBuilder<OrderEntity>(
      this.ordersRepository,
      queryRequest.filters,
    );
    const queryBuilder: SelectQueryBuilder<OrderEntity> =
      filterQueryBuilder.build();
    queryBuilder.offset(queryRequest.offset);
    queryBuilder.limit(queryRequest.limit);
    this.addOrderBy(queryRequest.sorting, queryBuilder);

    return await queryBuilder.getManyAndCount();
  }

  async saveOrder(order: OrderEntity) {
    order.status = OrderStatusEnum.active;
    return await this.ordersRepository.save(order);
  }

  async updateOrder(order: OrderEntity) {
    this.ordersLoader.clearKey(order.auctionId);
    order.status = OrderStatusEnum.inactive;
    order.modifiedDate = new Date(new Date().toUTCString());
    return await this.ordersRepository.save(order);
  }

  private addOrderBy(
    sorting: Sorting[],
    queryBuilder: SelectQueryBuilder<OrderEntity>,
  ) {
    sorting?.forEach((sort) =>
      queryBuilder.addOrderBy(
        sort.field,
        Sort[sort.direction] === 'ASC' ? 'ASC' : 'DESC',
      ),
    );
  }
}
