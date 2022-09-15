import { Inject, Injectable } from '@nestjs/common';
import {
  Auction,
  AuctionAbi,
  AuctionStatusEnum,
  ExternalAuctionAbi,
} from './models';
import '../../utils/extentions';
import { AuctionEntity } from 'src/db/auctions';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PerformanceProfiler } from '../metrics/performance.profiler';
import { MetricsCollector } from '../metrics/metrics.collector';
import { AuctionEventEnum } from '../assets/models';
import { TagEntity } from 'src/db/auctions/tags.entity';
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';
import { MarketplaceUtils } from './marketplaceUtils';
import { Marketplace } from '../marketplaces/models';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable()
export class AuctionsSetterService {
  constructor(
    private nftAbiService: NftMarketplaceAbiService,
    private assetByIdentifierService: AssetByIdentifierService,
    private persistenceService: PersistenceService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async saveAuction(
    auctionId: number,
    identifier: string,
    marketplace: Marketplace,
    hash: string,
  ): Promise<AuctionEntity> {
    let profiler = new PerformanceProfiler();
    try {
      const auctionData = await this.nftAbiService.getAuctionQuery(
        auctionId,
        marketplace,
      );
      const asset = await this.assetByIdentifierService.getAsset(identifier);
      if (auctionData) {
        const auctionEntity = MarketplaceUtils.isExternalMarketplace(
          marketplace.type,
        )
          ? AuctionEntity.fromExternalAuctionAbi(
              auctionId,
              auctionData as ExternalAuctionAbi,
              asset?.tags?.toString(),
              hash,
              marketplace.key,
            )
          : AuctionEntity.fromAuctionAbi(
              auctionId,
              auctionData as AuctionAbi,
              asset?.tags?.toString(),
              hash,
              marketplace.key,
            );
        const savedAuction = await this.persistenceService.insertAuction(
          auctionEntity,
        );

        if (asset?.tags) {
          let tags: TagEntity[] = [];
          for (const tag of asset?.tags) {
            tags = [
              ...tags,
              new TagEntity({ auctionId: savedAuction.id, tag: tag.trim() }),
            ];
          }

          await this.persistenceService.saveTags(tags);
        }
        return savedAuction;
      }
      return;
    } catch (error) {
      this.logger.error('An error occurred while savind an auction', error, {
        path: 'AuctionsService.saveAuction',
        auctionId,
        exception: error,
      });
    } finally {
      profiler.stop();
      MetricsCollector.setAuctionEventsDuration(
        AuctionEventEnum.AuctionTokenEvent,
        profiler.duration,
      );
    }
  }

  async saveAuctionEntity(
    auctionEntity: AuctionEntity,
    assetTags: string[],
  ): Promise<AuctionEntity> {
    let profiler = new PerformanceProfiler();
    try {
      const savedAuction = await this.persistenceService.insertAuction(
        auctionEntity,
      );

      if (assetTags) {
        let tags: TagEntity[] = [];
        for (const tag of assetTags) {
          tags = [
            ...tags,
            new TagEntity({ auctionId: savedAuction.id, tag: tag.trim() }),
          ];
        }

        await this.persistenceService.saveTags(tags);
      }
      return savedAuction;
    } catch (error) {
      this.logger.error('An error occurred while saving an auction', error, {
        path: 'AuctionsService.saveAuction',
        auctionEntity,
        exception: error,
      });
    } finally {
      profiler.stop();
      MetricsCollector.setAuctionEventsDuration(
        AuctionEventEnum.AuctionTokenEvent,
        profiler.duration,
      );
    }
  }

  async rollbackAuctionByHash(blockHash: string): Promise<boolean> {
    try {
      return await this.persistenceService.rollbackAuctionAndOrdersByHash(
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

  async updateAuctionStatus(
    id: number,
    status: AuctionStatusEnum,
    hash: string,
    auctionEvent: string,
  ): Promise<AuctionEntity> {
    let profiler = new PerformanceProfiler();
    try {
      return await this.persistenceService.updateAuctionStatus(
        id,
        status,
        hash,
      );
    } catch (error) {
      this.logger.error('An error occurred while updating auction status', {
        path: 'AuctionsService.updateAuctionStatus',
        id,
        exception: error,
      });
    } finally {
      profiler.stop();
      MetricsCollector.setAuctionEventsDuration(
        auctionEvent,
        profiler.duration,
      );
    }
  }

  async updateAuction(
    auction: AuctionEntity,
    auctionEvent: string,
  ): Promise<AuctionEntity> {
    let profiler = new PerformanceProfiler();
    try {
      return await this.persistenceService.updateAuction(auction);
    } catch (error) {
      this.logger.error('An error occurred while updating auction', {
        path: 'AuctionsService.updateAuction',
        id: auction.id,
        exception: error,
      });
    } finally {
      profiler.stop();
      MetricsCollector.setAuctionEventsDuration(
        auctionEvent,
        profiler.duration,
      );
    }
  }

  async updateAuctionByMarketplaceKey(
    id: number,
    marketplaceKey: string,
    status: AuctionStatusEnum,
    hash: string,
    auctionEvent: string,
  ): Promise<AuctionEntity> {
    let profiler = new PerformanceProfiler();
    try {
      return await this.persistenceService.updateAuctionByMarketplace(
        id,
        marketplaceKey,
        status,
        hash,
      );
    } catch (error) {
      this.logger.error('An error occurred while updating auction', {
        path: 'AuctionsService.updateAuctionByMarketplaceKey',
        id,
        exception: error,
      });
    } finally {
      profiler.stop();
      MetricsCollector.setAuctionEventsDuration(
        auctionEvent,
        profiler.duration,
      );
    }
  }

  async updateAuctions(auctions: AuctionEntity[]): Promise<Auction | any> {
    return await this.persistenceService.updateAuctions(auctions);
  }
}
