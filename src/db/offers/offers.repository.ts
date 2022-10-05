import { EntityRepository, Repository, SelectQueryBuilder } from 'typeorm';
import { OfferEntity } from '.';
import { OfferStatusEnum } from 'src/modules/offers/models';

@EntityRepository(OfferEntity)
export class OffersRepository extends Repository<OfferEntity> {
  async getActiveOffersForIdentifier(
    identifier: string,
  ): Promise<[OfferEntity[], number]> {
    return await this.createQueryBuilder('offer')
      .where(`offer.identifier = :identifier and offer.status='active'`, {
        identifier: identifier,
      })
      .getManyAndCount();
  }

  async saveOrder(order: OfferEntity) {
    return await this.save(order);
  }

  async updateOrderWithStatus(order: OfferEntity, status: OfferStatusEnum) {
    order.status = status;
    order.modifiedDate = new Date(new Date().toUTCString());
    return await this.save(order);
  }

  async rollbackOffersByHash(blockHash: string) {
    const ordersByHash = await this.getOrdersByBlockHash(blockHash);
    if (!ordersByHash || ordersByHash.length === 0) {
      return true;
    }
    for (let order of ordersByHash) {
      const [orders] = await this.getActiveOffersForIdentifier(
        order.identifier,
      );
      if (orders.length === 1) {
        return this.delete(orders[0].id);
      }
      const indexOf = orders.findIndex((o) => o.id === order.id);
      if (indexOf === orders.length - 1) {
        await this.delete(orders[indexOf].id);
        await this.updateOrderWithStatus(
          orders[indexOf - 1],
          OfferStatusEnum.Active,
        );
      } else {
        await this.delete(orders[indexOf].id);
      }
    }
  }

  async deleteOrdersByAuctionId(auctionIds: number[]) {
    return await this.createQueryBuilder()
      .delete()
      .from(OfferEntity)
      .where('auctionId in (:ids)', { ids: auctionIds })
      .execute();
  }

  private getOrdersByBlockHash(blockHash: string): Promise<OfferEntity[]> {
    return this.createQueryBuilder().where({ blockHash: blockHash }).getMany();
  }
}
