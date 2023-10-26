import { Injectable, Logger } from '@nestjs/common';
import { MxElasticService } from 'src/common';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { NftTraitsService } from 'src/modules/nft-traits/nft-traits.service';
import { ElasticQuery } from '@multiversx/sdk-nestjs-elastic';
import { Constants, Locker } from '@multiversx/sdk-nestjs-common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import {
  getCollectionsWhereTraitsFlagNotSetFromElasticQuery,
  getCollectionsWithTraitSummaryFromElasticQuery,
} from 'src/modules/nft-traits/nft-traits.elastic.queries';
import { ELASTIC_TOKENS_INDEX } from 'src/utils/constants';

@Injectable()
export class TraitsUpdaterService {
  constructor(
    private readonly nftTraitsService: NftTraitsService,
    private readonly redisCacheService: RedisCacheService,
    private readonly elasticService: MxElasticService,
    private readonly logger: Logger,
  ) {}

  async handleValidateTokenTraits(maxCollectionsToValidate: number) {
    try {
      await Locker.lock(
        `handleValidateTokenTraits`,
        async () => {
          const query: ElasticQuery = getCollectionsWithTraitSummaryFromElasticQuery(maxCollectionsToValidate);

          const lastIndex = await this.getLastValidatedCollectionIndex();
          let collections: string[] = [];

          await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'token', query, async (items) => {
            collections = collections.concat([...new Set(items.map((i) => i.token))]);
            if (collections.length > lastIndex + maxCollectionsToValidate) {
              return undefined;
            }
          });

          const collectionsToValidate = collections.slice(lastIndex, lastIndex + maxCollectionsToValidate);

          if (collectionsToValidate.length !== 0) {
            await this.updateCollectionTraits(collectionsToValidate);
            await this.setLastValidatedCollectionIndex(lastIndex + collectionsToValidate.length);
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

          const query = getCollectionsWhereTraitsFlagNotSetFromElasticQuery(maxCollectionsToUpdate);

          await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'token', query, async (items) => {
            const collections = [...new Set(items.map((i) => i.token))];
            collectionsToUpdate = collectionsToUpdate.concat(collections.filter((c) => collectionsToUpdate.indexOf(c) === -1));
            if (collectionsToUpdate.length >= maxCollectionsToUpdate) {
              return undefined;
            }
          });

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
        const tokensToUpdate: string[] = await this.redisCacheService.lpop(this.getTraitsQueueCacheKey());
        const notUpdatedNfts: string[] = await this.updateTokenTraits(tokensToUpdate);

        await this.addNftsToTraitQueue(notUpdatedNfts);
      },
      true,
    );
  }

  async addNftsToTraitQueue(collectionTickers: string[]): Promise<void> {
    if (collectionTickers?.length > 0) {
      await this.redisCacheService.rpush(this.getTraitsQueueCacheKey(), collectionTickers);
    }
  }

  private async getLastValidatedCollectionIndex(): Promise<number> {
    return Number.parseInt(await this.redisCacheService.get(this.getTraitsValidatorCounterCacheKey())) || 0;
  }

  private async setLastValidatedCollectionIndex(index: number): Promise<void> {
    await this.redisCacheService.set(this.getTraitsValidatorCounterCacheKey(), index.toString(), 90 * Constants.oneMinute());
  }

  private getTraitsQueueCacheKey() {
    return generateCacheKeyFromParams('traitsQueue');
  }

  private getTraitsValidatorCounterCacheKey() {
    return generateCacheKeyFromParams('traitsIndexerCounter');
  }
}
