import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ElrondElasticService } from 'src/common';
import { Locker } from 'src/utils/locker';
import { ElasticQuery, QueryType } from '@elrondnetwork/erdnest';
import { NftRarityService } from 'src/modules/nft-rarity/nft-rarity.service';
import { NftTypeEnum } from 'src/modules/assets/models';
import asyncPool from 'tiny-async-pool';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class ElasticRarityUpdaterService {
  constructor(
    private readonly elasticService: ElrondElasticService,
    private readonly nftRarityService: NftRarityService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
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
      this.logger.error(`ERROR when scrolling through NFTs`, {
        path: 'ElasticRarityUpdaterService.handleUpdateTokenRarity',
        exception: error?.message,
      });
    }

    collectionsToUpdate = [...new Set(collectionsToUpdate)];

    if (collectionsToUpdate.length === 0) {
      this.logger.info('handleUpdateTokenRarity(): nothing to update');
      return;
    }

    await asyncPool(1, collectionsToUpdate, async (collection) => {
      try {
        this.logger.info(
          `handleUpdateTokenRarity(): updateRarities(${collection})`,
        );
        await this.nftRarityService.updateRarities(collection);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(`Update rarities error.`, {
          path: 'ElasticRarityUpdaterService.handleValidateTokenRarity',
          exception: error?.message,
          collection: collection,
        });
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    });
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
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
      this.logger.error(`ERROR when scrolling through collections`, {
        path: 'ElasticRarityUpdaterService.handleValidateTokenRarity',
        exception: error?.message,
      });
    }

    if (collections.length === 0) {
      this.logger.info('handleValidateTokenRarity(): nothing to validate');
      return;
    }

    await asyncPool(1, collections, async (collection) => {
      try {
        this.logger.info(
          `handleValidateTokenRarity(): validateRarities(${collection})`,
        );
        await this.nftRarityService.validateRarities(collection);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(`Validate rarities error.`, {
          path: 'ElasticRarityUpdaterService.handleValidateTokenRarity',
          exception: error?.message,
          collection: collection,
        });
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    });
  }
}
