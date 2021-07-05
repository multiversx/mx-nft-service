import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { Auction, UpdateAuctionArgs } from './models';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { QueryRequest } from '../QueryRequest';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { cacheConfig } from 'src/config';
const hash = require('object-hash');

@Injectable()
export class AuctionsService {
  private redisClient: Redis.Redis;
  constructor(
    private nftAbiService: NftMarketplaceAbiService,
    private auctionServiceDb: AuctionsServiceDb,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.auctionsRedisClientName,
    );
  }

  async saveAuction(auctionId: number): Promise<Auction | any> {
    try {
      await this.invalidateCache();
      const auctionData = await this.nftAbiService.getAuctionQuery(auctionId);
      const savedAuction = await this.auctionServiceDb.insertAuction(
        AuctionEntity.fromAuctionAbi(auctionId, auctionData),
      );
      return savedAuction;
    } catch (error) {
      this.logger.error('An error occurred while savind an auction', error, {
        path: 'AuctionsService.saveAuction',
        auctionId,
      });
    }
  }

  async getAuctions(queryRequest: QueryRequest): Promise<[Auction[], number]> {
    try {
      const cacheKey = this.getAuctionsCacheKey(queryRequest);
      const getAssetLiked = () => this.getMappedAuctions(queryRequest);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAssetLiked,
        cacheConfig.auctionsttl,
      );
    } catch (error) {
      this.logger.error('An error occurred while get auctions', error, {
        path: 'AuctionsService.getAuctions',
        queryRequest,
      });
    }
  }

  private async getMappedAuctions(queryRequest: QueryRequest) {
    const [auctions, count] = await this.auctionServiceDb.getAuctions(
      queryRequest,
    );

    return [auctions.map((element) => Auction.fromEntity(element)), count];
  }

  async updateAuction(args: UpdateAuctionArgs): Promise<Auction | any> {
    await this.invalidateCache();
    return await this.auctionServiceDb.updateAuction(args.id, args.status);
  }

  private getAuctionsCacheKey(request: QueryRequest) {
    return generateCacheKeyFromParams('auctions', hash(request));
  }

  private async invalidateCache(): Promise<void> {
    return this.redisCacheService.flushDb(this.redisClient);
  }
}
