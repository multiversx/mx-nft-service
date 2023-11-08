import { Injectable, Logger } from '@nestjs/common';
import { MxElasticService } from 'src/common';
import { NftRarityService } from 'src/modules/nft-rarity/nft-rarity.service';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { NftRarityElasticService } from 'src/modules/nft-rarity/nft-rarity.elastic.service';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Locker } from '@multiversx/sdk-nestjs-common';
import { ELASTIC_TOKENS_INDEX } from 'src/utils/constants';

@Injectable()
export class RarityUpdaterService {
  constructor(
    private readonly elasticService: MxElasticService,
    private readonly nftRarityService: NftRarityService,
    private readonly nftRarityElasticService: NftRarityElasticService,
    private readonly redisCacheService: RedisCacheService,
    private readonly logger: Logger,
  ) {}

  async handleReindexAllTokenRarities(): Promise<void> {
    await this.nftRarityService.updateAllCollectionsRarities();
  }

  async handleValidateAllTokenRarities(): Promise<void> {
    await this.nftRarityService.validateAllCollectionsRarities();
  }

  async handleUpdateTokenRaritiesWhereNotSet(maxCollectionsToUpdate: number) {
    try {
      await Locker.lock(
        'handleUpdateTokenRaritiesWhereNotSet',
        async () => {
          let collectionsToUpdate: string[] = [];

          const query = this.nftRarityElasticService.getAllNftsWhereRarityNotComputedFromElasticQuery();

          await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'token', query, async (items) => {
            const collections = [...new Set(items.map((i) => i.token))];
            collectionsToUpdate = collectionsToUpdate.concat(collections.filter((c) => collectionsToUpdate.indexOf(c) === -1));
            if (collectionsToUpdate.length >= maxCollectionsToUpdate) {
              return false;
            }
          });

          collectionsToUpdate = collectionsToUpdate.slice(0, maxCollectionsToUpdate);

          await this.updateTokenRarities(collectionsToUpdate);
        },
        true,
      );
    } catch (error) {
      this.logger.error(`Error when scrolling through NFTs`, {
        path: 'RarityUpdaterService.handleUpdateTokenRarity',
        exception: error?.message,
      });
    }
  }

  async updateTokenRarities(collections: string[]): Promise<string[]> {
    let notUpdatedCollections: string[] = [];
    for (const collection of collections) {
      try {
        await Locker.lock(
          `Update/Validate rarities for ${collection}`,
          async () => {
            await this.nftRarityService.updateCollectionRarities(collection);
          },
          true,
        );
      } catch (error) {
        this.logger.error(`Error when updating collection rarities`, {
          path: 'RarityUpdaterService.handleValidateTokenRarity',
          exception: error?.message,
          collection: collection,
        });
        notUpdatedCollections.push(collection);
      }
    }
    return notUpdatedCollections;
  }

  async validateTokenRarities(collections: string[]): Promise<void> {
    for (const collection of collections) {
      try {
        await Locker.lock(
          `Update/Validate rarities for ${collection}`,
          async () => {
            await this.nftRarityService.validateRarities(collection);
          },
          true,
        );
      } catch (error) {
        this.logger.error(`Error when validating collection rarities`, {
          path: 'RarityUpdaterService.handleValidateTokenRarity',
          exception: error?.message,
          collection: collection,
        });
      }
    }
  }

  async processTokenRarityQueue() {
    await Locker.lock(
      'processTokenRarityQueue: Update rarities for all collections in the rarities queue',
      async () => {
        const collectionsToUpdate: string[] = await this.redisCacheService.lpop(this.getRarityQueueCacheKey());

        const notUpdatedCollections: string[] = await this.updateTokenRarities(collectionsToUpdate);

        await this.addCollectionsToRarityQueue(notUpdatedCollections);
      },
      true,
    );
  }

  async addCollectionsToRarityQueue(collectionTickers: string[]): Promise<void> {
    if (collectionTickers?.length > 0) {
      await this.redisCacheService.rpush(this.getRarityQueueCacheKey(), collectionTickers);
    }
  }

  private getRarityQueueCacheKey() {
    return generateCacheKeyFromParams('rarityQueue');
  }
}
