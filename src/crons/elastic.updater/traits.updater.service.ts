import { Injectable, Logger } from '@nestjs/common';
import { ElrondElasticService, RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { NftTraitsService } from 'src/modules/nft-traits/nft-traits.service';
import { Locker } from 'src/utils/locker';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import { NftTraitsElasticService } from 'src/modules/nft-traits/nft-traits.elastic.service';

@Injectable()
export class TraitsUpdaterService {
  private readonly traitsQueueRedisClient: Redis.Redis;

  constructor(
    private readonly nftTraitsService: NftTraitsService,
    private readonly redisCacheService: RedisCacheService,
    private readonly elasticService: ElrondElasticService,
    private readonly nftTraitsElasticService: NftTraitsElasticService,
    private readonly logger: Logger,
  ) {
    this.traitsQueueRedisClient = this.redisCacheService.getClient(
      cacheConfig.traitsQueueClientName,
    );
  }

  async handleSetTraitsWhereNotSet(maxCollectionsToUpdate: number) {
    try {
      await Locker.lock(
        'handleSetTraitsWhereNotSet',
        async () => {
          let collectionsToUpdate: string[] = [];

          const query =
            this.nftTraitsElasticService.getCollectionsWhereTraitsFlagNotSetFromElasticQuery(
              maxCollectionsToUpdate,
            );

          await this.elasticService.getScrollableList(
            'tokens',
            'token',
            query,
            async (items) => {
              const collections = [...new Set(items.map((i) => i.token))];
              collectionsToUpdate = collectionsToUpdate.concat(
                collections.filter(
                  (c) => collectionsToUpdate.indexOf(c) === -1,
                ),
              );
              if (collectionsToUpdate.length >= maxCollectionsToUpdate) {
                return undefined;
              }
            },
          );

          await this.updateCollectionTraits(collectionsToUpdate);
        },
        true,
      );
    } catch (error) {
      this.logger.error(`Error when scrolling through NFTs`, {
        path: 'TraitsUpdaterService.handleSetTraitsWhereNotSet',
        exception: error?.message,
      });
    }
  }

  async updateCollectionTraits(collections: string[]): Promise<string[]> {
    let notUpdatedCollections: string[] = [];
    for (const collection of collections) {
      try {
        await Locker.lock(
          `updateCollectionTraits ${collection}`,
          async () => {
            await this.nftTraitsService.updateCollectionTraits(collection);
          },
          true,
        );
      } catch (error) {
        this.logger.error(`Error when indexing collection traits`, {
          path: 'TraitsUpdaterService.updateCollectionTraits',
          exception: error?.message,
        });
        notUpdatedCollections.push(collection);
      }
    }
    return notUpdatedCollections;
  }

  async updateTokenTraits(identifiers: string[]): Promise<string[]> {
    let notUpdatedTokens: string[] = [];
    for (const identifier of identifiers) {
      try {
        await Locker.lock(
          `updateTokenTraits ${identifier}`,
          async () => {
            const token = getCollectionAndNonceFromIdentifier(identifier);
            if (token.nonce) {
              await this.nftTraitsService.updateNftTraits(identifier);
            } else {
              await this.nftTraitsService.updateCollectionTraits(identifier);
            }
          },
          true,
        );
      } catch (error) {
        this.logger.error(`Error when updating nft traits`, {
          path: 'TraitsUpdaterService.updateNftTraits',
          exception: error?.message,
          identifier: identifier,
        });
        notUpdatedTokens.push(identifier);
      }
    }
    return notUpdatedTokens;
  }

  async processTokenTraitsQueue() {
    await Locker.lock(
      'processTokenTraitsQueue: Update traits for all collections/NFTs in the traits queue',
      async () => {
        const tokensToUpdate: string[] =
          await this.redisCacheService.popAllItemsFromList(
            this.traitsQueueRedisClient,
            this.getTraitsQueueCacheKey(),
            true,
          );

        const notUpdatedNfts: string[] = await this.updateTokenTraits(
          tokensToUpdate,
        );

        await this.addNftsToTraitQueue(notUpdatedNfts);
      },
      true,
    );
  }

  async addNftsToTraitQueue(collectionTickers: string[]): Promise<void> {
    if (collectionTickers?.length > 0) {
      await this.redisCacheService.addItemsToList(
        this.traitsQueueRedisClient,
        this.getTraitsQueueCacheKey(),
        collectionTickers,
      );
    }
  }

  private getTraitsQueueCacheKey() {
    return generateCacheKeyFromParams(cacheConfig.traitsQueueClientName);
  }
}
