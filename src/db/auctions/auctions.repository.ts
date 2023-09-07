import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { constants, mxConfig } from 'src/config';
import { AuctionStatusEnum } from 'src/modules/auctions/models/AuctionStatus.enum';
import { AuctionCustomEnum, AuctionCustomSort } from 'src/modules/common/filters/AuctionCustomFilters';
import FilterQueryBuilder from 'src/modules/common/filters/FilterQueryBuilder';
import { Sorting, Sort } from 'src/modules/common/filters/filtersTypes';
import { QueryRequest } from 'src/modules/common/filters/QueryRequest';
import { CacheEventsPublisherService } from 'src/modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { CacheEventTypeEnum, ChangedEvent } from 'src/modules/rabbitmq/cache-invalidation/events/changed.event';
import { UsdPriceService } from 'src/modules/usdPrice/usd-price.service';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';
import { DateUtils } from 'src/utils/date-utils';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { getMarketplaceKeyFilter } from '../collection-stats/sqlUtils';
import { AuctionEntity } from './auction.entity';
import { AuctionWithStartBid } from './auctionWithBidCount.dto';
import { PriceRange } from './price-range';
import {
  getAuctionsForAsset,
  getAuctionsForIdentifierSortByPrice,
  getAuctionsForIdentifierSortByPriceCount,
  getAvailableTokensbyAuctionId,
  getAvailableTokensbyAuctionIds,
  getAvailableTokensScriptsByIdentifiers,
  getCurrentPaymentTokens,
  getDefaultAuctionsForIdentifierQuery,
  getDefaultAuctionsForIdentifierQueryCount,
  getDefaultAuctionsQuery,
  getLowestAuctionForIdentifiers,
  getLowestAuctionForIdentifiersAndMarketplace,
  getOnSaleAssetsCountForCollection,
} from './sql.queries';

@Injectable()
export class AuctionsRepository {
  constructor(
    @Inject(forwardRef(() => PersistenceService))
    private persistenceService: PersistenceService,
    private cacheEventsPublisherService: CacheEventsPublisherService,
    @Inject(forwardRef(() => UsdPriceService))
    private readonly usdPriceService: UsdPriceService,
    @InjectRepository(AuctionEntity)
    private auctionsRepository: Repository<AuctionEntity>,
  ) {}

  async getAuctions(queryRequest: QueryRequest): Promise<[AuctionEntity[], number, PriceRange]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(this.auctionsRepository, queryRequest.filters, 'a');
    const queryBuilder: SelectQueryBuilder<AuctionEntity> = filterQueryBuilder.build();
    const currentPriceSort = await this.handleCurrentPriceFilter(queryRequest, queryBuilder);
    queryBuilder.offset(queryRequest.offset);
    queryBuilder.limit(queryRequest.limit);
    if (currentPriceSort) {
      this.addCurrentPriceOrderBy(currentPriceSort, queryBuilder, 'a');
    } else {
      this.addOrderBy(queryRequest.sorting, queryBuilder, 'a');
    }
    const [response, priceRange] = await Promise.all([queryBuilder.getManyAndCount(), this.getMinMaxForQuery(queryRequest)]);
    return [...response, priceRange];
  }

  async getAuctionsGroupBy(queryRequest: QueryRequest): Promise<[AuctionEntity[] | AuctionWithStartBid[], number, PriceRange]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(this.auctionsRepository, queryRequest.filters, 'a');
    const queryBuilder: SelectQueryBuilder<AuctionEntity> = filterQueryBuilder.build();

    const currentPriceSort = await this.handleCurrentPriceFilter(queryRequest, queryBuilder);
    queryBuilder
      .select('a.*')
      .addSelect('IF(MAX(`ord`.`priceAmountDenominated`), MAX(`ord`.`priceAmountDenominated`), minBidDenominated) as startBid')
      .innerJoin(
        `(SELECT FIRST_VALUE(id) OVER (PARTITION BY identifier ORDER BY IF(price, price, minBidDenominated) ASC) AS id
    FROM (${getDefaultAuctionsQuery(queryRequest)})`,
        't',
        'a.id = t.id',
      )
      .leftJoin('orders', 'ord', 'ord.auctionId=a.id')
      .groupBy('a.id');
    queryBuilder.offset(queryRequest.offset);
    queryBuilder.limit(queryRequest.limit);
    if (currentPriceSort) {
      this.addCurrentPriceOrderBy(currentPriceSort, queryBuilder, 'a');
    } else {
      this.addOrderBy(queryRequest.sorting, queryBuilder, 'a');
    }

    const [auctions, count, priceRange] = await Promise.all([
      queryBuilder.getRawMany(),
      queryBuilder.getCount(),
      this.getMinMaxForQuery(queryRequest),
    ]);
    return [auctions, count, priceRange];
  }

  private async handleCurrentPriceFilter(queryRequest: QueryRequest, queryBuilder: SelectQueryBuilder<AuctionEntity>) {
    const maxBidValue = '1000000000';
    const paymentTokenFilter = queryRequest.getFilterName('paymentToken');
    let paymentDecimals = mxConfig.decimals;

    if (paymentTokenFilter) {
      const paymentToken = await this.usdPriceService.getToken(paymentTokenFilter);
      paymentDecimals = paymentToken?.decimals;
    }
    const currentPrice = queryRequest.customFilters?.find((f) => f.field === AuctionCustomEnum.CURRENTPRICE);
    const currentPriceSort = currentPrice?.sort;
    if (currentPrice || currentPriceSort) {
      queryBuilder.leftJoin('orders', 'o', 'o.auctionId=a.id AND o.id =(SELECT MAX(id) FROM orders o2 WHERE o2.auctionId = a.id)');
    }
    if (currentPrice) {
      const minBid = currentPrice.values?.length >= 1 && currentPrice.values[0] ? currentPrice.values[0] : 0;
      const minBidDenominated = BigNumberUtils.denominateAmount(minBid.toString(), paymentDecimals);
      const maxBid =
        currentPrice.values?.length >= 2 && currentPrice.values[1]
          ? currentPrice.values[1]
          : BigNumberUtils.nominateAmount(maxBidValue, paymentDecimals);
      const maxBidDenominated = BigNumberUtils.denominateAmount(maxBid.toString(), paymentDecimals);
      queryBuilder.andWhere(
        `(if(o.priceAmountDenominated, o.priceAmountDenominated BETWEEN ${minBidDenominated} AND ${maxBidDenominated}, 
          a.minBidDenominated BETWEEN ${minBidDenominated} AND ${maxBidDenominated})) `,
      );
    }
    return currentPriceSort;
  }

  async getAuctionsForIdentifier(queryRequest: QueryRequest): Promise<[AuctionEntity[], number, PriceRange]> {
    const identifier = queryRequest.filters.filters.find((x) => x.field === 'identifier').values[0];
    if (queryRequest?.sorting && queryRequest?.sorting.some((f) => f.field === 'topBidPrice')) {
      return await this.getAuctionsForIdentifierSortByPrice(queryRequest, identifier);
    } else if (queryRequest.sorting) {
      return this.getAuctions(queryRequest);
    }
    const defaultAuctionsQuery = getDefaultAuctionsForIdentifierQuery(
      queryRequest,
      identifier,
      queryRequest.limit,
      queryRequest.offset,
      queryRequest.filters?.filters?.find((x) => x.field === 'status')?.values,
    );
    const sqlAuctionsCount = getDefaultAuctionsForIdentifierQueryCount(
      queryRequest,
      identifier,
      queryRequest.filters?.filters?.find((x) => x.field === 'status')?.values,
    );
    const [auctions, count, priceRange] = await Promise.all([
      this.auctionsRepository.query(defaultAuctionsQuery),
      this.auctionsRepository.query(sqlAuctionsCount),
      this.getMinMaxForQuery(queryRequest),
    ]);

    return [auctions, count[0]?.Count, priceRange];
  }

  async getAuctionsForHash(blockHash: string): Promise<AuctionEntity[]> {
    return this.auctionsRepository.createQueryBuilder().where({ blockHash: blockHash }).getMany();
  }

  async getClaimableAuctions(
    limit: number = 10,
    offset: number = 0,
    address: string,
    marketplaceKey: string,
  ): Promise<[AuctionEntity[], number]> {
    return await this.auctionsRepository
      .createQueryBuilder('a')
      .innerJoin('orders', 'o', 'o.auctionId=a.id')
      .where(
        `a.status = '${AuctionStatusEnum.Claimable}' AND a.type <> 'SftOnePerPayment'
        ${getMarketplaceKeyFilter('a', marketplaceKey)} 
        AND (o.ownerAddress = :address AND o.status='active')`,
        {
          address: address,
          marketplaceKey: marketplaceKey,
        },
      )
      .groupBy('a.id')
      .orderBy('a.Id', 'DESC')
      .offset(offset)
      .limit(limit)
      .getManyAndCount();
  }

  async getAuctionsOrderByOrdersCountGroupByIdentifier(queryRequest: QueryRequest): Promise<[AuctionEntity[], number, PriceRange]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(this.auctionsRepository, queryRequest.filters, 'a');
    const queryBuilder: SelectQueryBuilder<AuctionEntity> = filterQueryBuilder.build();

    queryBuilder
      .addSelect('(SELECT COUNT(*) FROM orders WHERE orders.auctionId = a.id)', 'count')
      .andWhere(`a.type <> 'SftOnePerPayment'`)
      .addOrderBy('count', 'DESC')
      .addOrderBy('a.creationDate', 'DESC')
      .offset(queryRequest.offset)
      .limit(queryRequest.limit);

    const [auctions, priceRange] = await Promise.all([queryBuilder.getManyAndCount(), this.getMinMaxForQuery(queryRequest)]);
    return [...auctions, priceRange];
  }

  async getAuctionsOrderByOrdersCount(queryRequest: QueryRequest): Promise<[AuctionEntity[], number, PriceRange]> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(this.auctionsRepository, queryRequest.filters, 'a');
    const queryBuilder: SelectQueryBuilder<AuctionEntity> = filterQueryBuilder.build();
    queryBuilder
      .leftJoin('orders', 'o', 'o.auctionId=a.id')
      .groupBy('a.id')
      .orderBy('COUNT(a.Id)', 'DESC')
      .offset(queryRequest.offset)
      .limit(queryRequest.limit);

    const [auctions, priceRange] = await Promise.all([queryBuilder.getManyAndCount(), this.getMinMaxForQuery(queryRequest)]);
    return [...auctions, priceRange];
  }

  async getTrendingCollections(): Promise<any[]> {
    return this.auctionsRepository
      .createQueryBuilder('a')
      .select('a.collection as collection')
      .addSelect('COUNT(a.collection) as auctionsCount')
      .where({ status: AuctionStatusEnum.Running })
      .groupBy('a.collection')
      .orderBy('COUNT(a.collection)', 'DESC')
      .offset(0)
      .limit(1000)
      .execute();
  }

  async getTrendingCollectionsCount(): Promise<number> {
    const { count } = await this.auctionsRepository
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT(a.collection)) as count')
      .where({ status: AuctionStatusEnum.Running })
      .execute();

    return count;
  }

  async getActiveCollectionsFromLast30Days(): Promise<any[]> {
    return this.auctionsRepository
      .createQueryBuilder('a')
      .select('a.collection as collection')
      .addSelect('COUNT(a.collection) as auctionsCount')
      .where(`a.endDate BETWEEN '${DateUtils.getCurrentTimestampPlusDays(-30)}' AND '${DateUtils.getCurrentTimestamp()}'`)
      .groupBy('a.collection')
      .orderBy('COUNT(a.collection)', 'DESC')
      .offset(0)
      .limit(1000)
      .execute();
  }

  async getCollectionsActiveFromLast30DaysCount(): Promise<number> {
    const { count } = await this.auctionsRepository
      .createQueryBuilder('a')
      .select('COUNT(DISTINCT(a.collection)) as count')
      .where(`a.endDate BETWEEN '${DateUtils.getCurrentTimestampPlusDays(-30)}' AND '${DateUtils.getCurrentTimestamp()}'`)
      .execute();

    return count;
  }

  async getMinMax(token: string): Promise<PriceRange> {
    const response = await this.auctionsRepository
      .createQueryBuilder('a')
      .select(
        'GREATEST(MAX(`a`.`maxBidDenominated`),IF(ISNULL(MAX(`o`.`priceAmountDenominated`)), 0, MAX(`o`.`priceAmountDenominated`)), MAX(`a`.`minBidDenominated`)) AS maxBid, MIN(GREATEST(a.minBidDenominated,IF(ISNULL(o.priceAmountDenominated), a.minBidDenominated, o.priceAmountDenominated))) AS minBid',
      )
      .leftJoin(
        'orders',
        'o',
        `o.auctionId=a.id AND o.id =(SELECT MAX(id) FROM orders o2 WHERE o2.auctionId = a.id AND o2.priceToken='${token}')`,
      )
      .where({ status: AuctionStatusEnum.Running, paymentToken: token })
      .execute();
    return response[0];
  }

  private async getMinMaxForQuery(queryRequest: QueryRequest): Promise<PriceRange> {
    const filterQueryBuilder = new FilterQueryBuilder<AuctionEntity>(this.auctionsRepository, queryRequest.filters, 'a');
    const paymentTokenFilter = queryRequest.getFilterName('paymentToken');
    const paymentToken = paymentTokenFilter ?? mxConfig.egld;
    const queryBuilder: SelectQueryBuilder<AuctionEntity> = filterQueryBuilder.build();
    const response = await queryBuilder
      .select(
        'GREATEST(MAX(`a`.`maxBidDenominated`),IF(ISNULL(MAX(`o`.`priceAmountDenominated`)), 0, MAX(`o`.`priceAmountDenominated`)), MAX(`a`.`minBidDenominated`)) AS maxBid, MIN(GREATEST(a.minBidDenominated, IF(ISNULL(o.priceAmountDenominated), a.minBidDenominated, o.priceAmountDenominated))) AS minBid',
      )
      .leftJoin('orders', 'o', 'o.auctionId=a.id AND o.id =(SELECT MAX(id) FROM orders o2 WHERE o2.auctionId = a.id)')
      .andWhere(`a.paymentToken = '${paymentToken}'`)
      .execute();
    return { ...response[0], paymentToken };
  }

  async getAuction(id: number): Promise<AuctionEntity> {
    if (id !== undefined) {
      return await this.auctionsRepository.findOne({
        where: [{ id: id }],
      });
    }
    return null;
  }

  async getLastAuctionIdForMarketplace(marketplaceKey: string): Promise<number> {
    const { marketplaceAuctionId } = await this.auctionsRepository
      .createQueryBuilder('a')
      .select('a.marketplaceAuctionId as marketplaceAuctionId')
      .where({ marketplaceKey: marketplaceKey })
      .orderBy('id', 'DESC')
      .getRawOne();
    return marketplaceAuctionId;
  }

  async getBulkAuctions(auctionsIds: number[]): Promise<AuctionEntity[]> {
    return await this.auctionsRepository
      .createQueryBuilder('auctions')
      .where('id IN(:...auctionsIds)', {
        auctionsIds: auctionsIds,
      })
      .getMany();
  }

  async getBulkAuctionsByAuctionIdsAndMarketplace(auctionsIds: number[], marketplaceKey: string): Promise<AuctionEntity[]> {
    if (!auctionsIds || auctionsIds.length === 0) {
      return;
    }
    return await this.auctionsRepository
      .createQueryBuilder('auctions')
      .where(`marketplaceAuctionId IN(:...auctionsIds) and marketplaceKey='${marketplaceKey}'`, {
        auctionsIds: auctionsIds,
      })
      .getMany();
  }

  async getAuctionByMarketplace(id: number, marketplaceKey: string): Promise<AuctionEntity> {
    if (id !== undefined) {
      return await this.auctionsRepository.findOne({
        where: [{ marketplaceAuctionId: id, marketplaceKey: marketplaceKey }],
      });
    }
    return null;
  }

  async getAuctionByIdentifierAndMarketplace(identifier: string, marketplaceKey: string): Promise<AuctionEntity> {
    return await this.auctionsRepository.findOne({
      where: [
        {
          identifier: identifier,
          marketplaceKey: marketplaceKey,
          status: AuctionStatusEnum.Running,
        },
      ],
    });
  }

  async getAuctionCountForIdentifiers(identifiers: string[]): Promise<AuctionEntity[]> {
    return await this.auctionsRepository
      .createQueryBuilder('a')
      .select('a.identifier as identifier')
      .addSelect('COUNT(a.identifier) as auctionsCount')
      .where(`a.identifier IN(${identifiers.map((value) => `'${value}'`)}) and a.status='Running'`, {
        identifiers: identifiers,
      })
      .groupBy('a.identifier')
      .execute();
  }

  async getAuctionsForIdentifiers(identifiers: string[]): Promise<any[]> {
    return await this.auctionsRepository.query(
      getAuctionsForAsset(
        identifiers.map((value) => value.split('_')[0]),
        parseInt(identifiers[0].split('_')[1]),
        parseInt(identifiers[0].split('_')[2]),
      ),
    );
  }

  async getBulkAuctionsByIdentifiersAndMarketplace(identifiers: string[], marketplaceKey: string): Promise<any[]> {
    return await this.auctionsRepository
      .createQueryBuilder('auctions')
      .where(`identifier IN(:...identifiers) and marketplaceKey='${marketplaceKey}'`, {
        identifiers: identifiers,
      })
      .getMany();
  }

  async getAvailableTokensByAuctionId(id: number): Promise<any> {
    return await this.auctionsRepository.query(getAvailableTokensbyAuctionId(id));
  }

  async getAvailableTokensForIdentifiers(identifiers: string[]): Promise<any> {
    return await this.auctionsRepository.query(getAvailableTokensScriptsByIdentifiers(identifiers));
  }

  async getAvailableTokensForAuctionIds(auctionIds: number[]): Promise<any> {
    return await this.auctionsRepository.query(getAvailableTokensbyAuctionIds(auctionIds));
  }

  async getLowestAuctionForIdentifiers(identifiers: string[]): Promise<any> {
    return await this.auctionsRepository.query(getLowestAuctionForIdentifiers(identifiers));
  }

  async getLowestAuctionForIdentifiersAndMarketplace(identifiers: string[]): Promise<any> {
    return await this.auctionsRepository.query(
      getLowestAuctionForIdentifiersAndMarketplace(
        identifiers.map((value) => value.split('_')[0]),
        identifiers[0].split('_')[1],
      ),
    );
  }

  async getOnSaleAssetCountForCollections(identifiers: string[]): Promise<any> {
    return await this.auctionsRepository.query(getOnSaleAssetsCountForCollection(identifiers));
  }

  async getAuctionsThatReachedDeadline(): Promise<AuctionEntity[]> {
    return await this.auctionsRepository
      .createQueryBuilder('a')
      .where({ status: AuctionStatusEnum.Running })
      .andWhere(`a.endDate > 0 AND a.endDate <= ${DateUtils.getCurrentTimestamp()}`)
      .limit(1000)
      .getMany();
  }

  async insertAuction(auction: AuctionEntity): Promise<AuctionEntity> {
    await this.triggerCacheInvalidation(auction.identifier, auction.ownerAddress, auction.marketplaceKey);
    return await this.auctionsRepository.save(auction);
  }

  async saveBulkAuctions(auctions: AuctionEntity[]): Promise<void> {
    await this.auctionsRepository.save(auctions, {
      chunk: constants.dbBatch,
    });
  }

  async rollbackAuctionAndOrdersByHash(blockHash: string): Promise<any> {
    const auctions = await this.getAuctionsForHash(blockHash);
    if (!auctions || auctions.length === 0) {
      return true;
    }
    await this.rollbackWithdrawAndEndAuction(auctions);
    await this.rollbackCreateAuction(auctions);
  }

  private async getAuctionsForIdentifierSortByPrice(
    queryRequest: QueryRequest,
    identifier: string,
  ): Promise<[AuctionEntity[], number, PriceRange]> {
    const [auctions, count, priceRange] = await Promise.all([
      this.auctionsRepository.query(getAuctionsForIdentifierSortByPrice(identifier, queryRequest.limit, queryRequest.offset)),
      this.auctionsRepository.query(getAuctionsForIdentifierSortByPriceCount(identifier)),
      this.getMinMaxForQuery(queryRequest),
    ]);
    return [auctions, count[0]?.Count, priceRange];
  }

  private async rollbackCreateAuction(auctions: AuctionEntity[]) {
    const runningAuction = auctions.filter((a) => a.status === 'Running');

    if (runningAuction.length > 0) {
      const deleteAuction = await this.auctionsRepository.delete(runningAuction.map((a) => a.id));
      if (deleteAuction) {
        await this.persistenceService.deleteOrdersByAuctionId(runningAuction.map((a) => a.id));
      }
    }
  }

  private async rollbackWithdrawAndEndAuction(auctions: AuctionEntity[]) {
    const closedAuctins = auctions?.filter((a) => a.status !== 'Running');
    await this.updateAuctions(
      closedAuctins?.map((a) => {
        return {
          ...a,
          status: AuctionStatusEnum.Running,
          modifiedDate: new Date(new Date().toUTCString()),
        };
      }),
    );
  }

  async updateAuction(auction: AuctionEntity): Promise<AuctionEntity> {
    await this.triggerCacheInvalidation(auction.identifier, auction.ownerAddress, auction.marketplaceKey);

    auction.modifiedDate = new Date(new Date().toUTCString());
    return await this.auctionsRepository.save(auction);
  }

  async updateAuctionStatus(auctionId: number, status: AuctionStatusEnum, hash: string): Promise<AuctionEntity> {
    let auction = await this.getAuction(auctionId);

    await this.triggerCacheInvalidation(auction.identifier, auction.ownerAddress, auction.marketplaceKey);
    if (auction) {
      auction.status = status;
      auction.blockHash = hash;
      auction.modifiedDate = new Date(new Date().toUTCString());
      return await this.auctionsRepository.save(auction);
    }
    return null;
  }

  async updateAuctionByMarketplace(
    auctionId: number,
    marketplaceKey: string,
    status: AuctionStatusEnum,
    hash: string,
  ): Promise<AuctionEntity> {
    let auction = await this.getAuctionByMarketplace(auctionId, marketplaceKey);

    await this.triggerCacheInvalidation(auction.identifier, auction.ownerAddress, auction.marketplaceKey);
    if (auction) {
      auction.status = status;
      auction.blockHash = hash;
      auction.modifiedDate = new Date(new Date().toUTCString());
      return await this.auctionsRepository.save(auction);
    }
    return null;
  }

  async updateAuctions(auctions: AuctionEntity[]): Promise<any> {
    for (let auction of auctions) {
      await this.triggerCacheInvalidation(auction.identifier, auction.ownerAddress, auction.marketplaceKey);
    }
    return await this.auctionsRepository.save(auctions);
  }

  private async triggerCacheInvalidation(identifier: string, ownerAddress: string, marketplaceKey: string) {
    await this.cacheEventsPublisherService.publish(
      new ChangedEvent({
        id: identifier,
        type: CacheEventTypeEnum.UpdateAuction,
        address: ownerAddress,
        extraInfo: { marketplaceKey: marketplaceKey },
      }),
    );
  }

  private addOrderBy(sorting: Sorting[], queryBuilder: SelectQueryBuilder<AuctionEntity>, alias: string = null) {
    if (sorting) {
      sorting?.forEach((sort) =>
        queryBuilder.addOrderBy(alias ? `${alias}.${sort.field}` : sort.field, Sort[sort.direction] === 'ASC' ? 'ASC' : 'DESC'),
      );
      if (!sorting.find((sort) => sort.field === 'id')) {
        queryBuilder.addOrderBy(alias ? `${alias}.id` : 'id', 'ASC');
      }
    }
  }

  private addCurrentPriceOrderBy(sort: AuctionCustomSort, queryBuilder: SelectQueryBuilder<AuctionEntity>, alias: string = null) {
    queryBuilder.addGroupBy('o.priceAmountDenominated');
    queryBuilder.addOrderBy(
      'if(o.priceAmountDenominated, o.priceAmountDenominated, a.minBidDenominated)',

      Sort[sort.direction] === 'ASC' ? 'ASC' : 'DESC',
    ),
      queryBuilder.addOrderBy(alias ? `${alias}.id` : 'id', 'ASC');
  }

  async getCurrentPaymentTokenIds(
    marketplaceKey?: string,
    collectionIdentifier?: string,
  ): Promise<{ paymentToken: string; activeAuctions: number }[]> {
    const paymentTokens = await this.auctionsRepository.query(getCurrentPaymentTokens(marketplaceKey, collectionIdentifier));

    return paymentTokens.map((r: { paymentToken: any; count: any }) => {
      return {
        paymentToken: r.paymentToken,
        activeAuctions: r.count,
      };
    });
  }
}
