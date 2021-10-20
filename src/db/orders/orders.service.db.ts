import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import FilterQueryBuilder from 'src/modules/FilterQueryBuilder';
import { Sort, Sorting } from 'src/modules/filtersTypes';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { OrderStatusEnum } from '../../modules/orders/models';
import { QueryRequest } from '../../modules/QueryRequest';
import { ActiveOrdersProvider, OrderEntity, OrdersProvider } from '.';

@Injectable()
export class OrdersServiceDb {
  constructor(
    private ordersLoader: OrdersProvider,
    private activeOrdersLoades: ActiveOrdersProvider,
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

  private getOrdersForAuction(auctionId: number): Promise<OrderEntity[]> {
    return this.ordersRepository
      .createQueryBuilder('order')
      .where(`order.auctionId = :id`, {
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
    this.clearCache(order.auctionId);
    order.status = OrderStatusEnum.active;
    return await this.ordersRepository.save(order);
  }

  async updateOrder(order: OrderEntity) {
    this.clearCache(order.auctionId);
    order.status = OrderStatusEnum.inactive;
    order.modifiedDate = new Date(new Date().toUTCString());
    return await this.ordersRepository.save(order);
  }

  async updateOrderWithStatus(order: OrderEntity, status: OrderStatusEnum) {
    this.clearCache(order.auctionId);
    order.status = status;
    order.modifiedDate = new Date(new Date().toUTCString());
    return await this.ordersRepository.save(order);
  }

  async deleteOrdersByHash(blockHash: string) {
    const ordersByHash = await this.getOrdersByBlockHash(blockHash);
    if (!ordersByHash || ordersByHash.length === 0) {
      return true;
    }
    for (let order of ordersByHash) {
      const orders = await this.getOrdersForAuction(order.auctionId);
      if (orders.length === 1) {
        return this.ordersRepository.delete(orders[0].id);
      }
      const indexOf = orders.findIndex((o) => o.id === order.id);
      if (indexOf === orders.length - 1) {
        await this.ordersRepository.delete(orders[indexOf].id);
        await this.updateOrderWithStatus(
          orders[indexOf - 1],
          OrderStatusEnum.active,
        );
      } else {
        await this.ordersRepository.delete(orders[indexOf].id);
      }
    }
  }

  private getOrdersByBlockHash(blockHash: string): Promise<OrderEntity[]> {
    return this.ordersRepository
      .createQueryBuilder()
      .where({ blockHash: blockHash })
      .getMany();
  }

  async deleteOrdersByAuctionId(auctionIds: number[]) {
    auctionIds.forEach((auctionId) => {
      this.ordersLoader.clearKey(auctionId);
      this.activeOrdersLoades.clearKey(auctionId);
    });

    return await this.ordersRepository
      .createQueryBuilder()
      .delete()
      .from(OrderEntity)
      .where('auctionId in (:ids)', { ids: auctionIds })
      .execute();
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

  private clearCache(auctionId: number) {
    this.ordersLoader.clearKey(auctionId);
    this.activeOrdersLoades.clearKey(auctionId);
  }
}
