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
  private readonly logger: Logger;

  constructor(
    private readonly elasticService: ElrondElasticService,
    private readonly nftRarityService: NftRarityService,
  ) {
    this.logger = new Logger(ElasticRarityUpdaterService.name);
  }

  private static isValidating: boolean;

  @Cron(CronExpression.EVERY_HOUR)
  async handleUpdateTokenRarity() {
    let collectionsToUpdate: string[] = [];

    if (ElasticRarityUpdaterService.isValidating) {
      return;
    }

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
      this.logger.error(
        `handleUpdateTokenRarity() ERROR when scrolling through NFTs: ${error}`,
      );
    }

    collectionsToUpdate = [...new Set(collectionsToUpdate)];

    if (collectionsToUpdate.length === 0) {
      this.logger.debug('handleUpdateTokenRarity(): nothing to update');
      return;
    }

    await asyncPool(1, collectionsToUpdate, async (collection) => {
      try {
        this.logger.debug(
          `handleUpdateTokenRarity(): updateRarities(${collection})`,
        );
        if (ElasticRarityUpdaterService.isValidating) return;
        await this.nftRarityService.updateRarities(collection);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(
          `handleUpdateTokenRarity() ERROR for ${collection}: ${error}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleValidateTokenRarity() {
    let collections: string[] = [];

    if (ElasticRarityUpdaterService.isValidating) {
      return;
    } else {
      ElasticRarityUpdaterService.isValidating = true;
    }

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
      this.logger.error(
        `handleValidateTokenRarity() ERROR when scrolling through collections: ${error}`,
      );
    }

    if (collections.length === 0) {
      this.logger.debug('handleValidateTokenRarity(): nothing to validate');
      ElasticRarityUpdaterService.isValidating = false;
      return;
    }

    await asyncPool(1, collections, async (collection) => {
      try {
        this.logger.debug(
          `handleValidateTokenRarity(): validateRarities(${collection})`,
        );
        await this.nftRarityService.validateRarities(collection);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        this.logger.error(
          `handleValidateTokenRarity() ERROR for ${collection}: ${error}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    });

    ElasticRarityUpdaterService.isValidating = false;
  }
}
