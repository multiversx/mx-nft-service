import { Injectable, Logger } from '@nestjs/common';
import {
  Auction,
  AuctionAbi,
  AuctionStatusEnum,
  ExternalAuctionAbi,
} from './models';
import '../../utils/extensions';
import { AuctionEntity } from 'src/db/auctions';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { PerformanceProfiler } from '../metrics/performance.profiler';
import { MetricsCollector } from '../metrics/metrics.collector';
import { AuctionEventEnum } from '../assets/models';
import { TagEntity } from 'src/db/auctions/tags.entity';
import { AssetByIdentifierService } from '../assets/asset-by-identifier.service';
import { MarketplaceUtils } from './marketplaceUtils';
import { Marketplace } from '../marketplaces/models';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { UsdPriceService } from '../usdPrice/usd-price.service';
import { elrondConfig } from 'src/config';
import { BigNumberUtils } from 'src/utils/bigNumber-utils';

@Injectable()
export class AuctionsSetterService {
  constructor(
    private nftAbiService: NftMarketplaceAbiService,
    private assetByIdentifierService: AssetByIdentifierService,
    private persistenceService: PersistenceService,
    private usdPriceService: UsdPriceService,
    private readonly logger: Logger,
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
        let auctionEntity: AuctionEntity;
        if (MarketplaceUtils.isExternalMarketplace(marketplace.type)) {
          const externalAuction = auctionData as ExternalAuctionAbi;
          const paymentToken = await this.usdPriceService.getToken(
            externalAuction.payment_token_type.toString(),
          );
          auctionEntity = AuctionEntity.fromExternalAuctionAbi(
            auctionId,
            externalAuction,
            asset?.tags?.toString(),
            hash,
            marketplace.key,
            paymentToken?.decimals ?? elrondConfig.decimals,
          );
        } else {
          const internalAuction = auctionData as AuctionAbi;
          const paymentToken = await this.usdPriceService.getToken(
            internalAuction.payment_token.valueOf().toString(),
          );
          auctionEntity = AuctionEntity.fromAuctionAbi(
            auctionId,
            internalAuction,
            asset?.tags?.toString(),
            hash,
            marketplace.key,
            paymentToken.decimals,
          );
        }

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
      const paymentToken = await this.usdPriceService.getToken(
        auction.paymentToken,
      );
      const decimals = paymentToken?.decimals ?? elrondConfig.decimals;
      return await this.persistenceService.updateAuction({
        ...auction,
        maxBidDenominated: BigNumberUtils.denominateAmount(
          auction.maxBid,
          decimals,
        ),
        minBidDenominated: BigNumberUtils.denominateAmount(
          auction.minBid,
          decimals,
        ),
      });
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
