import { EntityRepository, Repository, SelectQueryBuilder } from 'typeorm';
import { OrderStatusEnum } from '../../modules/orders/models';
import { OrderEntity } from '.';
import { QueryRequest } from 'src/modules/common/filters/QueryRequest';
import FilterQueryBuilder from 'src/modules/common/filters/FilterQueryBuilder';
import { Sorting, Sort } from 'src/modules/common/filters/filtersTypes';
import { getOrdersForAuctions } from '../auctions/sql.queries';

@EntityRepository(OrderEntity)
export class OrdersRepository extends Repository<OrderEntity> {
  async getActiveOrderForAuction(auctionId: number): Promise<OrderEntity> {
    return await this.createQueryBuilder('order')
      .where(`order.auctionId = :id and order.status='active'`, {
        id: auctionId,
      })
      .getOne();
  }

  async getActiveOrdersForAuction(auctionId: number): Promise<OrderEntity[]> {
    return await this.createQueryBuilder('order')
      .where(`order.auctionId = :id and order.status='active'`, {
        id: auctionId,
      })
      .getMany();
  }

  async getOrdersByAuctionIdsOrderByPrice(
    auctionIds: number[],
  ): Promise<OrderEntity[]> {
    return await this.createQueryBuilder('orders')
      .orderBy('priceAmountDenominated', 'DESC')
      .where(`auctionId IN(:...auctionIds)`, {
        auctionIds: auctionIds,
      })
      .getMany();
  }

  async getOrdersByComposedKeys(auctionIds: string[]): Promise<any[]> {
    return await this.query(
      getOrdersForAuctions(
        auctionIds.map((value) => value.split('_')[0]),
        parseInt(auctionIds[0].split('_')[1]),
        parseInt(auctionIds[0].split('_')[2]),
      ),
    );
  }

  async getLastOrdersByAuctionIds(auctionIds: number[]): Promise<any[]> {
    return await this.createQueryBuilder('orders')
      .orderBy('priceAmountDenominated', 'DESC')
      .where(
        `auctionId IN(:...auctionIds) and status in ('active', 'bought')`,
        {
          auctionIds: auctionIds,
        },
      )
      .getMany();
  }

  async getOrdersByAuctionIds(auctionIds: number[]): Promise<OrderEntity[]> {
    const orders = await this.createQueryBuilder('orders')
      .where(`auctionId IN(:...auctionIds) and status in ('active')`, {
        auctionIds: auctionIds,
      })
      .getMany();

    return orders?.groupBy((asset) => asset.auctionId);
  }

  async getOrders(
    queryRequest: QueryRequest,
  ): Promise<[OrderEntity[], number]> {
    const filterQueryBuilder = new FilterQueryBuilder<OrderEntity>(
      this,
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
    return await this.save(order);
  }

  async updateOrderWithStatus(order: OrderEntity, status: OrderStatusEnum) {
    order.status = status;
    order.modifiedDate = new Date(new Date().toUTCString());
    return await this.save(order);
  }

  async rollbackOrdersByHash(blockHash: string) {
    const ordersByHash = await this.getOrdersByBlockHash(blockHash);
    if (!ordersByHash || ordersByHash.length === 0) {
      return true;
    }
    for (let order of ordersByHash) {
      const orders = await this.getOrdersForAuction(order.auctionId);
      if (orders.length === 1) {
        return this.delete(orders[0].id);
      }
      const indexOf = orders.findIndex((o) => o.id === order.id);
      if (indexOf === orders.length - 1) {
        await this.delete(orders[indexOf].id);
        await this.updateOrderWithStatus(
          orders[indexOf - 1],
          OrderStatusEnum.Active,
        );
      } else {
        await this.delete(orders[indexOf].id);
      }
    }
  }

  async deleteOrdersByAuctionId(auctionIds: number[]) {
    return await this.createQueryBuilder()
      .delete()
      .from(OrderEntity)
      .where('auctionId in (:ids)', { ids: auctionIds })
      .execute();
  }

  private getOrdersByBlockHash(blockHash: string): Promise<OrderEntity[]> {
    return this.createQueryBuilder().where({ blockHash: blockHash }).getMany();
  }

  private getOrdersForAuction(auctionId: number): Promise<OrderEntity[]> {
    return this.createQueryBuilder('order')
      .where(`order.auctionId = :id`, {
        id: auctionId,
      })
      .getMany();
  }

  private addOrderBy(
    sorting: Sorting[],
    queryBuilder: SelectQueryBuilder<OrderEntity>,
  ) {
    if (sorting) {
      sorting?.forEach((sort) =>
        queryBuilder.addOrderBy(
          sort.field,
          Sort[sort.direction] === 'ASC' ? 'ASC' : 'DESC',
        ),
      );
      if (!sorting.find((sort) => sort.field === 'id')) {
        queryBuilder.addOrderBy('id', 'DESC');
      }
    }
  }
}
