import { PerformanceProfiler } from '@elrondnetwork/erdnest';
import { Injectable } from '@nestjs/common';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';
import { AssetLikeEntity, AssetsLikesRepository } from 'src/db/assets';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { DeleteResult } from 'typeorm';
import { PersistenceInterface } from './persistance.interface';

@Injectable()
export class PersistenceService implements PersistenceInterface {
  constructor(
    private readonly assetsLikesRepository: AssetsLikesRepository,
    private readonly accountStatsRepository: AccountStatsRepository,
  ) {}

  private async execute<T>(key: string, action: Promise<T>): Promise<T> {
    const profiler = new PerformanceProfiler();

    try {
      return await action;
    } finally {
      profiler.stop();

      MetricsCollector.setPersistenceDuration(key, profiler.duration);
    }
  }

  async getAssetsLiked(
    limit: number = 20,
    offset: number = 0,
    address: string,
  ): Promise<[AssetLikeEntity[], number]> {
    return await this.execute(
      'getAssetsLiked',
      this.assetsLikesRepository.getAssetsLiked(limit, offset, address),
    );
  }

  async isAssetLiked(identifier: string, address: string): Promise<boolean> {
    return await this.execute(
      'isAssetLiked',
      this.assetsLikesRepository.isAssetLiked(identifier, address),
    );
  }

  async getAssetLikesCount(identifier: string): Promise<number> {
    return await this.execute(
      'getAssetLikesCount',
      this.assetsLikesRepository.getAssetLikesCount(identifier),
    );
  }

  async getBulkAssetLikesCount(identifiers: string[]): Promise<any> {
    return await this.execute(
      'getBulkAssetLikesCount',
      this.assetsLikesRepository.getBulkAssetLikesCount(identifiers),
    );
  }

  async getIsLikedAsset(identifiers: string[]): Promise<any> {
    return await this.execute(
      'getIsLikedAsset',
      this.assetsLikesRepository.getIsLikedAsset(identifiers),
    );
  }

  async addLike(assetLikeEntity: AssetLikeEntity): Promise<AssetLikeEntity> {
    return await this.execute(
      'addLike',
      this.assetsLikesRepository.addLike(assetLikeEntity),
    );
  }

  async removeLike(identifier: string, address: string): Promise<DeleteResult> {
    return await this.execute(
      'removeLike',
      this.assetsLikesRepository.removeLike(identifier, address),
    );
  }

  async getPublicAccountStats(
    address: string,
    marketplaceKey: string = null,
  ): Promise<AccountStatsEntity> {
    return await this.execute(
      'getPublicAccountStats',
      this.accountStatsRepository.getPublicAccountStats(
        address,
        marketplaceKey,
      ),
    );
  }

  async getOnwerAccountStats(
    address: string,
    marketplaceKey: string = null,
  ): Promise<AccountStatsEntity> {
    return await this.execute(
      'getOnwerAccountStats',
      this.accountStatsRepository.getOnwerAccountStats(address, marketplaceKey),
    );
  }

  async getAccountClaimableCount(
    address: string,
    marketplaceKey: string = null,
  ): Promise<number> {
    return await this.execute(
      'getAccountClaimableCount',
      this.accountStatsRepository.getAccountClaimableCount(
        address,
        marketplaceKey,
      ),
    );
  }
}
