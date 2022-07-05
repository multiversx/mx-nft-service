import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ElrondElasticService } from 'src/common';
import { Locker } from 'src/utils/locker';
import { ElasticQuery, QueryType } from '@elrondnetwork/erdnest';
import { NftRarityService } from 'src/modules/nft-rarity/nft-rarity.service';
import { NftTypeEnum } from 'src/modules/assets/models';
import asyncPool from 'tiny-async-pool';

@Injectable()
export class ElasticRarityUpdaterService {
  constructor(
    private readonly elasticService: ElrondElasticService,
    private readonly nftRarityService: NftRarityService,
    private readonly logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleUpdateTokenRarity() {
    let collectionsToUpdate: string[] = [];

    try {
      await Locker.lock(
        'Elastic updater: Update tokens rarity',
        async () => {
          const query = ElasticQuery.create()
            .withMustNotExistCondition('nft_hasRarity')
            .withMustNotExistCondition('rarities')
            .withMustExistCondition('token')
            .withMustMultiShouldCondition(
              [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
              (type) => QueryType.Match('type', type),
            )
            .withPagination({ from: 0, size: 10000 });

          await this.elasticService.getScrollableList(
            'tokens',
            'token',
            query,
            async (items) => {
              collectionsToUpdate = collectionsToUpdate.concat(
                items.map((i) => i.token),
              );
            },
          );
        },
        true,
      );
    } catch (error) {
      this.logger.error(`Error when scrolling through NFTs`, {
        path: 'ElasticRarityUpdaterService.handleUpdateTokenRarity',
        exception: error?.message,
      });
    }

    collectionsToUpdate = [...new Set(collectionsToUpdate)];

    await asyncPool(1, collectionsToUpdate, async (collection) => {
      try {
        this.logger.log(
          `handleUpdateTokenRarity(): updateRarities(${collection})`,
        );
        await this.nftRarityService.updateRarities(collection);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(`Error when updating collection raritiies`, {
          path: 'ElasticRarityUpdaterService.handleValidateTokenRarity',
          exception: error?.message,
          collection: collection,
        });
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleValidateTokenRarity() {
    let collections: string[] = [];

    try {
      await Locker.lock(
        'Elastic updater: Validate tokens rarity',
        async () => {
          const query = ElasticQuery.create()
            .withMustNotExistCondition('nonce')
            .withMustMultiShouldCondition(
              [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
              (type) => QueryType.Match('type', type),
            )
            .withPagination({ from: 0, size: 10000 });

          await this.elasticService.getScrollableList(
            'tokens',
            'token',
            query,
            async (items) => {
              collections = collections.concat(items.map((i) => i.token));
            },
          );
        },
        true,
      );
    } catch (error) {
      this.logger.error(`Error when scrolling through collections`, {
        path: 'ElasticRarityUpdaterService.handleValidateTokenRarity',
        exception: error?.message,
      });
    }

    await asyncPool(1, collections, async (collection) => {
      try {
        this.logger.log(
          `handleValidateTokenRarity(): validateRarities(${collection})`,
        );
        await this.nftRarityService.validateRarities(collection);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(`Error when validating collection rarities`, {
          path: 'ElasticRarityUpdaterService.handleValidateTokenRarity',
          exception: error?.message,
          collection: collection,
        });
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    });
  }
}
