import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { Auction, AuctionStatusEnum } from './models';
import { AuctionEntity, AuctionsServiceDb } from 'src/db/auctions';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { QueryRequest, TrendingQueryRequest } from '../QueryRequest';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { cacheConfig } from 'src/config';
import { ElrondApiService, RedisCacheService } from 'src/common';
import { GroupBy } from '../filtersTypes';
const hash = require('object-hash');

@Injectable()
export class AuctionsService {
  private redisClient: Redis.Redis;
  constructor(
    private nftAbiService: NftMarketplaceAbiService,
    private apiService: ElrondApiService,
    private auctionServiceDb: AuctionsServiceDb,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.auctionsRedisClientName,
    );
  }

  async saveAuction(
    auctionId: number,
    identifier: string,
    hash: string,
  ): Promise<Auction | any> {
    try {
      await this.invalidateCache();
      const auctionData = await this.nftAbiService.getAuctionQuery(auctionId);
      const asset = await this.apiService.getNftByIdentifier(identifier);
      const savedAuction = await this.auctionServiceDb.insertAuction(
        AuctionEntity.fromAuctionAbi(
          auctionId,
          auctionData,
          asset?.tags?.toString(),
          hash,
        ),
      );
      return savedAuction;
    } catch (error) {
      this.logger.error('An error occurred while savind an auction', error, {
        path: 'AuctionsService.saveAuction',
        auctionId,
        exception: error,
      });
    }
  }

  async getAuctions(queryRequest: QueryRequest): Promise<[Auction[], number]> {
    try {
      const cacheKey = this.getAuctionsCacheKey(queryRequest);
      const getAuctions = () => this.getMappedAuctions(queryRequest);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAuctions,
        30,
      );
    } catch (error) {
      this.logger.error('An error occurred while get auctions', {
        path: 'AuctionsService.getAuctions',
        queryRequest,
        exception: error,
      });
    }
  }

  async getAuctionsOrderByNoBids(
    queryRequest: QueryRequest,
  ): Promise<[Auction[], number]> {
    try {
      const cacheKey = this.getAuctionsCacheKey(queryRequest);
      const getAuctions = () => this.getMappedAuctionsOrderBids(queryRequest);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAuctions,
      );
    } catch (error) {
      this.logger.error('An error occurred while get auctions', {
        path: 'AuctionsService.getAuctions',
        queryRequest,
        exception: error,
      });
    }
  }

  async deleteAuctionByHash(blockHash: string): Promise<boolean> {
    try {
      return await this.auctionServiceDb.deleteAuctionAndOrdersByHash(
        blockHash,
      );
    } catch (error) {
      this.logger.error('An error occurred while deleteAuction', {
        path: 'AuctionsService.deleteAuctionByHash',
        blockHash,
        exception: error,
      });
    }
  }

  async getTrendingAuctions(
    queryRequest: TrendingQueryRequest,
  ): Promise<[Auction[], number]> {
    try {
      const cacheKey = this.getAuctionsCacheKey(queryRequest);
      const getTrendingAuctions = () =>
        this.getMappedTrendingAuctions(queryRequest);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getTrendingAuctions,
        cacheConfig.auctionsttl,
      );
    } catch (error) {
      this.logger.error('An error occurred while get auctions', {
        path: 'AuctionsService.getTrendingAuctions',
        queryRequest,
        exception: error,
      });
    }
  }

  async getClaimableAuctions(
    limit: number = 10,
    offset: number = 0,
    address: string,
  ): Promise<[Auction[], number]> {
    try {
      const cacheKey = this.getClaimableAuctionsCacheKey(
        address,
        limit,
        offset,
      );
      const getTrendingAuctions = () =>
        this.getMappedClaimableAuctions(limit, offset, address);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getTrendingAuctions,
        30,
      );
    } catch (error) {
      this.logger.error('An error occurred while get auctions', {
        path: 'AuctionsService.getClaimableAuctions',
        address,
        exception: error,
      });
    }
  }

  private async getMappedTrendingAuctions(queryRequest: TrendingQueryRequest) {
    const [auctions, count] = await this.auctionServiceDb.getTrendingAuctions(
      queryRequest,
    );

    return [auctions?.map((element) => Auction.fromEntity(element)), count];
  }

  private async getMappedClaimableAuctions(
    limit: number = 10,
    offset: number = 0,
    address: string,
  ) {
    const [auctions, count] = await this.auctionServiceDb.getClaimableAuctions(
      limit,
      offset,
      address,
    );

    return [auctions?.map((element) => Auction.fromEntity(element)), count];
  }

  private async getMappedAuctions(queryRequest: QueryRequest) {
    let [auctions, count] = [[], 0];

    if (queryRequest?.filters?.filters?.some((f) => f.field === 'identifier')) {
      [auctions, count] = await this.auctionServiceDb.getAuctionsForIdentifier(
        queryRequest,
      );
    } else {
      if (queryRequest?.groupByOption?.groupBy === GroupBy.IDENTIFIER) {
        [auctions, count] = await this.auctionServiceDb.getAuctionsGroupBy(
          queryRequest,
        );
      } else {
        [auctions, count] = await this.auctionServiceDb.getAuctions(
          queryRequest,
        );
      }
    }
    return [auctions?.map((element) => Auction.fromEntity(element)), count];
  }

  private async getMappedAuctionsOrderBids(queryRequest: QueryRequest) {
    const [auctions, count] =
      await this.auctionServiceDb.getAuctionsOrderByOrdersCount(queryRequest);

    return [auctions?.map((element) => Auction.fromEntity(element)), count];
  }

  async updateAuction(
    id: number,
    status: AuctionStatusEnum,
    hash: string,
  ): Promise<Auction | any> {
    await this.invalidateCache();
    return await this.auctionServiceDb.updateAuction(id, status, hash);
  }

  private getAuctionsCacheKey(request: any) {
    return generateCacheKeyFromParams('auctions', hash(request));
  }

  private getClaimableAuctionsCacheKey(address: string, limit, offset) {
    return generateCacheKeyFromParams(
      'claimable_auctions',
      address,
      limit,
      offset,
    );
  }

  private async invalidateCache(): Promise<void> {
    return this.redisCacheService.flushDb(this.redisClient);
  }
}
