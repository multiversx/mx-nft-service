import { Inject, Injectable } from '@nestjs/common';
import { Auction, AuctionStatusEnum } from './models';
import '../../utils/extentions';
import { AuctionEntity } from 'src/db/auctions';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { ElrondApiService, RedisCacheService } from 'src/common';
import { AuctionsServiceDb } from 'src/db/auctions/auctions.service.db';

@Injectable()
export class AuctionsSetterService {
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

  async rollbackAuctionByHash(blockHash: string): Promise<boolean> {
    try {
      return await this.auctionServiceDb.rollbackAuctionAndOrdersByHash(
        blockHash,
      );
    } catch (error) {
      this.logger.error('An error occurred while rollback Auctions', {
        path: 'AuctionsService.rollbackAuctionByHash',
        blockHash,
        exception: error,
      });
    }
  }

  async updateAuction(
    id: number,
    status: AuctionStatusEnum,
    hash: string,
  ): Promise<Auction | any> {
    await this.invalidateCache();
    return await this.auctionServiceDb.updateAuction(id, status, hash);
  }

  async updateAuctions(auctions: AuctionEntity[]): Promise<Auction | any> {
    await this.invalidateCache();
    return await this.auctionServiceDb.updateAuctions(auctions);
  }

  private async invalidateCache(): Promise<void> {
    return this.redisCacheService.flushDb(this.redisClient);
  }
}
