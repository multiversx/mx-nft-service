import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ElrondElasticService } from 'src/common';
import { NftsFlagsRepository } from 'src/db/nftFlags/nft-flags.repository';
import { NftTypeEnum } from 'src/modules/assets/models';
import { BatchUtils } from 'src/utils/batch.utils';
import { Locker } from 'src/utils/locker';
import {
  ElasticQuery,
  QueryType,
} from '@elrondnetwork/nestjs-microservice-common';
import asyncPool from 'tiny-async-pool';

// this is not done
@Injectable()
export class ElasticUpdaterService {
  private readonly logger: Logger;

  constructor(
    private elasticService: ElrondElasticService,
    private flagsService: NftsFlagsRepository,
  ) {
    this.logger = new Logger(ElasticUpdaterService.name);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleUpdateTokenNsfw() {
    await Locker.lock(
      'Elastic updater: Update tokens nsfw',
      async () => {
        const query = ElasticQuery.create()
          .withFields(['nft_nsfw'])
          .withMustExistCondition('identifier')
          .withMustMultiShouldCondition(
            [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
            (type) => QueryType.Match('type', type),
          )
          .withPagination({ from: 0, size: 10000 });

        await this.elasticService.getScrollableList(
          'tokens',
          'identifier',
          query,
          async (items) => {
            const nsfwItems = items.map((item) => ({
              identifier: item.identifier,
              nsfw: item.api_nsft,
            }));

            await this.updateNsfwForTokens(nsfwItems);
          },
        );
      },
      true,
    );
  }

  private async updateNsfwForTokens(
    items: { identifier: string; nsfw: number }[],
  ): Promise<void> {
    const indexedItems = items.toRecord((item) => item.identifier);

    const databaseResult = await BatchUtils.batchGet(
      items,
      (item) => item.identifier,
      async (elements) =>
        await this.flagsService.batchGetFlags(
          elements.map((x) => x.identifier),
        ),
      100,
    );

    const itemsToUpdate: { identifier: string; nsfw: number }[] = [];

    for (const identifier of Object.keys(databaseResult)) {
      const item: any = indexedItems[identifier];
      if (!item) {
        continue;
      }

      const currentFlag = databaseResult[identifier];
      const actualMedia = item.nsfw;

      if (currentFlag !== actualMedia) {
        itemsToUpdate.push({
          identifier: identifier,
          nsfw: currentFlag,
        });
      }
    }

    await asyncPool(
      5,
      itemsToUpdate,
      async (item) => await this.updateNsfwForToken(item.identifier, item.nsfw),
    );
  }

  private async updateNsfwForToken(
    identifier: string,
    nsfw: number,
  ): Promise<void> {
    try {
      this.logger.log(`Setting nsfw for '${identifier}'`);
      await this.elasticService.setCustomValue(
        'tokens',
        identifier,
        'nsfw',
        nsfw,
      );
    } catch (error) {
      this.logger.error(
        `Unexpected error when updating nsfw for token with identifier '${identifier}'`,
      );
    }
  }
}
