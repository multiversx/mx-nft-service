import { Injectable, Logger } from '@nestjs/common';
import { ElrondElasticService, RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig, constants } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { TimeConstants } from 'src/utils/time-utils';
import { NftTraitsService } from 'src/modules/nft-traits/nft-traits.service';
import { ElasticQuery, QueryType } from '@elrondnetwork/erdnest';
import { NftTypeEnum } from 'src/modules/assets/models';
import { Locker } from 'src/utils/locker';

@Injectable()
export class TraitsUpdaterService {
  private readonly traitsQueueRedisClient: Redis.Redis;
  private readonly persistentRedisClient: Redis.Redis;

  constructor(
    private readonly nftTraitsService: NftTraitsService,
    private readonly redisCacheService: RedisCacheService,
    private readonly elasticService: ElrondElasticService,
    private readonly logger: Logger,
  ) {
    this.traitsQueueRedisClient = this.redisCacheService.getClient(
      cacheConfig.traitsQueueClientName,
    );
    this.persistentRedisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async handleValidateTokenTraits(maxCollectionsToValidate: number) {
    try {
      await Locker.lock(
        `handleValidateTokenTraits`,
        async () => {
          const query: ElasticQuery = ElasticQuery.create()
            .withMustExistCondition('token')
            .withMustNotExistCondition('nonce')
            .withMustCondition(QueryType.Match('nft_hasTraitSummary', true))
            .withMustMultiShouldCondition(
              [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
              (type) => QueryType.Match('type', type),
            )
            .withPagination({
              from: 0,
              size: Math.min(
                constants.getCollectionsFromElasticBatchSize,
                maxCollectionsToValidate,
              ),
            });

          const lastIndex = await this.getLastValidatedCollectionIndex();
          let collections: string[] = [];

          await this.elasticService.getScrollableList(
            'tokens',
            'token',
            query,
            async (items) => {
              collections = collections.concat([
                ...new Set(items.map((i) => i.token)),
              ]);
              if (collections.length > lastIndex + maxCollectionsToValidate) {
                return undefined;
              }
            },
          );

          const collectionsToValidate = collections.slice(
            lastIndex,
            lastIndex + maxCollectionsToValidate,
          );

          if (collectionsToValidate.length !== 0) {
            await this.updateCollectionTraits(collectionsToValidate);
            await this.setLastValidatedCollectionIndex(
              lastIndex + collectionsToValidate.length,
            );
          } else {
            await this.setLastValidatedCollectionIndex(0);
          }
        },
        true,
      );
    } catch (error) {
      this.logger.error(`Error when validating collection traits`, {
        path: 'TraitsUpdaterService.handleValidateTokenTraits',
        exception: error?.message,
      });
    }
  }

  async handleSetTraitsWhereNotSet(maxCollectionsToUpdate: number) {
    try {
      await Locker.lock(
        'handleSetTraitsWhereNotSet',
        async () => {
          let collectionsToUpdate: string[] = [];

          const query = ElasticQuery.create()
            .withMustExistCondition('token')
            .withMustNotExistCondition('nonce')
            .withMustNotCondition(QueryType.Match('nft_hasTraitSummary', true))
            .withMustMultiShouldCondition(
              [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
              (type) => QueryType.Match('type', type),
            )
            .withPagination({
              from: 0,
              size: Math.min(
                constants.getCollectionsFromElasticBatchSize,
                maxCollectionsToUpdate,
              ),
            });

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
            },
            maxCollectionsToUpdate,
          );

          collectionsToUpdate = collectionsToUpdate.slice(
            0,
            maxCollectionsToUpdate,
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

  async processTokenTraitsQueue() {
    await Locker.lock(
      'processTokenTraitsQueue: Update traits for all collections in the traits queue',
      async () => {
        const collectionsToUpdate: string[] =
          await this.redisCacheService.popAllItemsFromList(
            this.traitsQueueRedisClient,
            this.getTraitsQueueCacheKey(),
            true,
          );

        const notUpdatedCollections: string[] =
          await this.updateCollectionTraits(collectionsToUpdate);

        await this.addCollectionsToTraitsQueue(notUpdatedCollections);
      },
      true,
    );
  }

  async addCollectionsToTraitsQueue(
    collectionTickers: string[],
  ): Promise<void> {
    if (collectionTickers?.length > 0) {
      await this.redisCacheService.addItemsToList(
        this.traitsQueueRedisClient,
        this.getTraitsQueueCacheKey(),
        collectionTickers,
      );
    }
  }

  private async getLastValidatedCollectionIndex(): Promise<number> {
    return (
      Number.parseInt(
        await this.persistentRedisClient.get(
          this.getTraitsValidatorCounterCacheKey(),
        ),
      ) || 0
    );
  }

  private async setLastValidatedCollectionIndex(index: number): Promise<void> {
    await this.persistentRedisClient.set(
      this.getTraitsValidatorCounterCacheKey(),
      index.toString(),
      'EX',
      90 * TimeConstants.oneMinute,
    );
  }

  private getTraitsQueueCacheKey() {
    return generateCacheKeyFromParams(cacheConfig.traitsQueueClientName);
  }

  private getTraitsValidatorCounterCacheKey() {
    return generateCacheKeyFromParams('traitsIndexerCounter');
  }
}
