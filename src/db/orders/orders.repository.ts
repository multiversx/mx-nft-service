import { Repository, SelectQueryBuilder } from 'typeorm';
import { OrderStatusEnum } from '../../modules/orders/models';
import { OrderEntity } from '.';
import { QueryRequest } from 'src/modules/common/filters/QueryRequest';
import FilterQueryBuilder from 'src/modules/common/filters/FilterQueryBuilder';
import { Sorting, Sort } from 'src/modules/common/filters/filtersTypes';
import { getOrdersForAuctions } from '../auctions/sql.queries';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { constants } from 'src/config';

@Injectable()
export class OrdersRepository {
  constructor(
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

  async getOrdersByAuctionIdsOrderByPrice(auctionIds: number[]): Promise<OrderEntity[]> {
    return await this.ordersRepository
      .createQueryBuilder('orders')
      .orderBy('priceAmountDenominated', 'DESC')
      .where(`auctionId IN(:...auctionIds)`, {
        auctionIds: auctionIds,
      })
      .getMany();
  }

  async getOrdersByComposedKeys(auctionIds: string[]): Promise<any[]> {
    return await this.ordersRepository.query(
      getOrdersForAuctions(
        auctionIds.map((value) => value.split('_')[0]),
        parseInt(auctionIds[0].split('_')[1]),
        parseInt(auctionIds[0].split('_')[2]),
      ),
    );
  }

  async getLastOrdersByAuctionIds(auctionIds: number[]): Promise<any[]> {
    return await this.ordersRepository
      .createQueryBuilder('orders')
      .orderBy('priceAmountDenominated', 'DESC')
      .where(`auctionId IN(:...auctionIds) and status in ('active', 'bought')`, {
        auctionIds: auctionIds,
      })
      .getMany();
  }

  async getOrdersByAuctionIdsGroupByAuctionId(auctionIds: number[]): Promise<OrderEntity[]> {
    const orders = await this.ordersRepository
      .createQueryBuilder('o')
      .where(`o.auctionId IN(:...auctionIds)`, {
        auctionIds: auctionIds,
      })
      .getMany();
    return orders?.groupBy((asset) => asset.auctionId);
  }

  async getOrdersByAuctionIds(auctionIds: number[]): Promise<OrderEntity[]> {
    return await this.ordersRepository
      .createQueryBuilder('o')
      .where(`o.auctionId IN(:...auctionIds)`, {
        auctionIds: auctionIds,
      })
      .getMany();
  }

  async getOrders(queryRequest: QueryRequest): Promise<[OrderEntity[], number]> {
    const filterQueryBuilder = new FilterQueryBuilder<OrderEntity>(this.ordersRepository, queryRequest.filters);
    const queryBuilder: SelectQueryBuilder<OrderEntity> = filterQueryBuilder.build();
    queryBuilder.offset(queryRequest.offset);
    queryBuilder.limit(queryRequest.limit);
    this.addOrderBy(queryRequest.sorting, queryBuilder);

    return await queryBuilder.getManyAndCount();
  }

  async saveOrder(order: OrderEntity) {
    return await this.ordersRepository.save(order);
  }

  async getBulkOrdersByMarketplaceAndAuctionIds(orders: OrderEntity[]): Promise<OrderEntity[]> {
    const auctionIds = orders.filter((o) => o.id === undefined).map((o) => o.auctionId);
    if (auctionIds.length === 0) {
      return [];
    }
    const ordersResponse = await this.ordersRepository
      .createQueryBuilder('o')
      .select('*')
      .where(`o.auctionId IN(:...auctionIds)`, {
        auctionIds: auctionIds,
      })
      .execute();

    for (let i = 0; i < orders.length; i++) {
      if (orders[i].id !== undefined) {
        continue;
      }
      let similarOrders = orders.filter(
        (o) =>
          o.auctionId === orders[i].auctionId &&
          o.ownerAddress === orders[i].ownerAddress &&
          o.priceToken === orders[i].priceToken &&
          o.priceAmount === orders[i].priceAmount,
      );
      const similarOrdersWithIdsCount = similarOrders.filter((o) => o.id !== undefined).length;
      const correspondingDbOrders = ordersResponse.filter(
        (o: OrderEntity) =>
          o.auctionId === orders[i].auctionId &&
          o.ownerAddress === orders[i].ownerAddress &&
          o.priceToken === orders[i].priceToken &&
          o.priceAmount === orders[i].priceAmount,
      );
      orders[i].id = correspondingDbOrders?.[similarOrders.length - similarOrdersWithIdsCount - 1]?.id;
    }
    return orders;
  }

  async saveBulkOrdersOrUpdateAndFillId(orders: OrderEntity[]): Promise<void> {
    if (orders.length === 0) {
      return;
    }
    orders = await this.getBulkOrdersByMarketplaceAndAuctionIds(orders);

    const saveOrUpdateResponse = await this.ordersRepository
      .createQueryBuilder()
      .insert()
      .into('orders')
      .values(orders)
      .orUpdate({
        overwrite: [
          'creationDate',
          'modifiedDate',
          'boughtTokensNo',
          'status',
          'priceToken',
          'priceNonce',
          'priceAmount',
          'priceAmountDenominated',
          'ownerAddress',
          'blockHash',
        ],
        conflict_target: ['id', 'auctionId', 'blockHash'],
      })
      .execute();

    if (saveOrUpdateResponse.identifiers.length === 0 || orders.findIndex((a) => a.id === undefined) !== -1) {
      orders = await this.getBulkOrdersByMarketplaceAndAuctionIds(orders);
    }
    if (orders.findIndex((a) => a.id === undefined) !== -1) {
      throw new Error('oooppps');
    }
  }

  async updateOrderWithStatus(order: OrderEntity, status: OrderStatusEnum) {
    order.status = status;
    order.modifiedDate = new Date(new Date().toUTCString());
    return await this.ordersRepository.save(order);
  }

  async rollbackOrdersByHash(blockHash: string) {
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
        await this.updateOrderWithStatus(orders[indexOf - 1], OrderStatusEnum.Active);
      } else {
        await this.ordersRepository.delete(orders[indexOf].id);
      }
    }
  }

  async deleteOrdersByAuctionId(auctionIds: number[]) {
    return await this.ordersRepository
      .createQueryBuilder()
      .delete()
      .from(OrderEntity)
      .where('auctionId in (:ids)', { ids: auctionIds })
      .execute();
  }

  private getOrdersByBlockHash(blockHash: string): Promise<OrderEntity[]> {
    return this.ordersRepository.createQueryBuilder().where({ blockHash: blockHash }).getMany();
  }

  private getOrdersForAuction(auctionId: number): Promise<OrderEntity[]> {
    return this.ordersRepository
      .createQueryBuilder('order')
      .where(`order.auctionId = :id`, {
        id: auctionId,
      })
      .getMany();
  }

  private addOrderBy(sorting: Sorting[], queryBuilder: SelectQueryBuilder<OrderEntity>) {
    if (sorting) {
      sorting?.forEach((sort) => queryBuilder.addOrderBy(sort.field, Sort[sort.direction] === 'ASC' ? 'ASC' : 'DESC'));
      if (!sorting.find((sort) => sort.field === 'id')) {
        queryBuilder.addOrderBy('id', 'DESC');
      }
    }
  }
}
