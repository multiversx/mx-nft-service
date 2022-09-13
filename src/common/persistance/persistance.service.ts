import { PerformanceProfiler } from '@elrondnetwork/erdnest';
import { Injectable } from '@nestjs/common';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';
import { AssetLikeEntity, AssetsLikesRepository } from 'src/db/assets';
import { TagEntity } from 'src/db/auctions/tags.entity';
import { TagsRepository } from 'src/db/auctions/tags.repository';
import { CollectionStatsEntity } from 'src/db/collection-stats/collection-stats';
import { CollectionStatsRepository } from 'src/db/collection-stats/collection-stats.repository';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { DeleteResult } from 'typeorm';
import { NftTag } from '../services/elrond-communication/models/nft.dto';
import { PersistenceInterface } from './persistance.interface';

@Injectable()
export class PersistenceService implements PersistenceInterface {
  constructor(
    private readonly assetsLikesRepository: AssetsLikesRepository,
    private readonly accountStatsRepository: AccountStatsRepository,
    private readonly tagsRepository: TagsRepository,
    private readonly collectionStatsRepository: CollectionStatsRepository,
  ) {}

  private async execute<T>(key: string, action: Promise<T>): Promise<T> {
    const profiler = new PerformanceProfiler();

    try {
      console.log({ key });
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

  async getTagsBySearchTerm(
    searchTerm: string,
    page: number = 0,
    size: number = 10,
  ): Promise<NftTag[]> {
    return await this.execute(
      'getTagsBySearchTerm',
      this.tagsRepository.getTagsBySearchTerm(searchTerm, page, size),
    );
  }

  async getTags(size: number): Promise<NftTag[]> {
    return await this.execute('getTags', this.tagsRepository.getTags(size));
  }

  async getTagsCount(): Promise<number> {
    return await this.execute(
      'getTagsCount',
      this.tagsRepository.getTagsCount(),
    );
  }

  async getTagsBySearchTermCount(searchTerm: string): Promise<number> {
    return await this.execute(
      'getTagsBySearchTermCount',
      this.tagsRepository.getTagsBySearchTermCount(searchTerm),
    );
  }

  async saveTags(tags: TagEntity[]): Promise<TagEntity[]> {
    return await this.execute('saveTags', this.tagsRepository.saveTags(tags));
  }

  async getStats(identifier: string): Promise<CollectionStatsEntity> {
    return await this.execute(
      'getStats',
      this.collectionStatsRepository.getStats(identifier),
    );
  }
}
