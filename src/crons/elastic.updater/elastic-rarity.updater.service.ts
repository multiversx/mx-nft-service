import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ElrondElasticService } from 'src/common';
import { NftsFlagsRepository } from 'src/db/nftFlags/nft-flags.repository';
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

  @Cron(CronExpression.EVERY_HOUR)
  async handleUpdateTokenRarity() {
    let collectionsToUpdate: string[] = [];

    await Locker.lock(
      'Elastic updater: Update tokens rarity',
      async () => {
        const query = ElasticQuery.create()
          .withMustNotExistCondition('nft_rank')
          .withMustNotExistCondition('nft_score')
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

    collectionsToUpdate = [...new Set(collectionsToUpdate)];

    await asyncPool(
      5,
      collectionsToUpdate,
      async (collection) =>
        await this.nftRarityService.updateRarities(collection),
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleValidateTokenRarity() {
    let collections: string[] = [];

    await Locker.lock(
      'Elastic updater: Validate tokens rarity',
      async () => {
        const query = ElasticQuery.create()
          .withMustNotExistCondition('nonce')
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
            collections = collections.concat(items.map((i) => i.token));
          },
        );
      },
      true,
    );

    await asyncPool(
      5,
      collections,
      async (collection) =>
        await this.nftRarityService.validateRarities(collection),
    );
  }
}
