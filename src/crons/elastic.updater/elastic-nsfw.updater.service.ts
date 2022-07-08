import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ElrondElasticService } from 'src/common';
import { NftTypeEnum } from 'src/modules/assets/models';
import { Locker } from 'src/utils/locker';
import { BatchUtils, ElasticQuery, QueryType } from '@elrondnetwork/erdnest';
import asyncPool from 'tiny-async-pool';
import { FlagNftService } from 'src/modules/admins/flag-nft.service';
import { AssetsRedisHandler } from 'src/modules/assets';

type NsfwType = {
  identifier: string;
  nsfw: number;
};

@Injectable()
export class ElasticNsfwUpdaterService {
  constructor(
    private elasticService: ElrondElasticService,
    private flagsNftService: FlagNftService,
    private assetsRedisHandler: AssetsRedisHandler,
    private readonly logger: Logger,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleValidateNsfw() {
    await Locker.lock(
      'Elastic updater: Update tokens nsfw from database',
      async () => {
        const query = ElasticQuery.create()
          .withFields(['nft_nsfw_mark'])
          .withMustExistCondition('identifier')
          .withMustMultiShouldCondition(
            [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
            (type) => QueryType.Match('type', type),
          )
          .withMustCondition(
            QueryType.Nested('data', { 'data.nonEmptyURIs': true }),
          )
          .withMustCondition(
            QueryType.Nested('data', { 'data.whiteListedStorage': true }),
          )
          .withPagination({ from: 0, size: 10000 });

        await this.elasticService.getScrollableList(
          'tokens',
          'identifier',
          query,
          async (items) => {
            const nsfwItems = items.map((item) => ({
              identifier: item.identifier,
              nsfw: item.nft_nsfw_mark,
            }));

            await this.validateNsfwValues(nsfwItems);
          },
        );
      },
      true,
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleUpdateTokenNsfw() {
    await Locker.lock(
      'Elastic updater: Update tokens nsfw',
      async () => {
        const query = ElasticQuery.create()
          .withMustNotExistCondition('nft_nsfw_mark')
          .withMustExistCondition('identifier')
          .withMustMultiShouldCondition(
            [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
            (type) => QueryType.Match('type', type),
          )
          .withMustCondition(
            QueryType.Nested('data', { 'data.nonEmptyURIs': true }),
          )
          .withMustCondition(
            QueryType.Nested('data', { 'data.whiteListedStorage': true }),
          )
          .withPagination({ from: 0, size: 10000 });

        await this.elasticService.getScrollableList(
          'tokens',
          'identifier',
          query,
          async (items) => {
            const nsfwItems = items.map((item) => ({
              identifier: item.identifier,
              nsfw: item.nft_nsfw_mark,
            }));

            await this.updateNsfwForTokens(nsfwItems);
          },
        );
      },
      true,
    );
  }

  private async updateNsfwForTokens(items: NsfwType[]): Promise<void> {
    const databaseResult = await BatchUtils.batchGet(
      items,
      (item) => item.identifier,
      async (elements) =>
        await this.flagsNftService.getNftFlagsForIdentifiers(
          elements.map((x) => x.identifier),
        ),
      100,
    );
    const itemsToUpdate: NsfwType[] = [];
    for (const item of items) {
      if (!databaseResult || !databaseResult[item.identifier]) {
        await this.flagsNftService.updateNftFlag(item.identifier);
      } else {
        const currentFlag = databaseResult[item.identifier].nsfw;
        const actualFlag = item.nsfw;

        if (parseFloat(currentFlag) !== parseFloat(actualFlag.toString())) {
          itemsToUpdate.push({
            identifier: item.identifier,
            nsfw: currentFlag,
          });
        }
      }
    }

    await asyncPool(
      5,
      itemsToUpdate,
      async (item) => await this.updateNsfwForToken(item.identifier, item.nsfw),
    );
  }

  private async validateNsfwValues(items: NsfwType[]): Promise<void> {
    const indexedItems = items.toRecord((item) => item.identifier);
    const databaseResult = await BatchUtils.batchGet(
      items,
      (item) => item.identifier,
      async (elements) =>
        await this.flagsNftService.getNftFlagsForIdentifiers(
          elements.map((x) => x.identifier),
        ),
      100,
    );
    const itemsToUpdate: NsfwType[] = [];
    for (const identifier of Object.keys(databaseResult)) {
      const item: any = indexedItems[identifier];
      if (!item) {
        continue;
      }
      const currentFlag = databaseResult[item.identifier].nsfw;
      const actualFlag = item.nsfw;

      if (
        actualFlag === undefined ||
        parseFloat(currentFlag) !== parseFloat(actualFlag)
      ) {
        itemsToUpdate.push({
          identifier: item.identifier,
          nsfw: currentFlag,
        });
      }
    }

    await this.bulkUpdate(itemsToUpdate);
    await this.assetsRedisHandler.clearMultipleKeys(
      itemsToUpdate.map((nft) => nft.identifier),
    );
  }

  private async updateNsfwForToken(
    identifier: string,
    nsfw: number,
  ): Promise<void> {
    try {
      this.logger.log(`Setting nsfw for '${identifier}' with value ${nsfw}`);
      await this.elasticService.setCustomValue(
        'tokens',
        identifier,
        this.elasticService.buildUpdateBody<number>('nft_nsfw_mark', nsfw),
        '?retry_on_conflict=2',
      );
    } catch (error) {
      this.logger.error(
        `Unexpected error when updating nsfw for token with identifier '${identifier}'`,
        {
          identifier,
          path: 'ElasticNsfwUpdaterService.updateNsfwForToken',
          exception: error?.message,
        },
      );
    }
  }

  private async bulkUpdate(items: NsfwType[]): Promise<void> {
    try {
      if (items && items.length > 0) {
        this.logger.log(`Updating NSFW flag`);
        await this.elasticService.bulkRequest(
          'tokens',
          this.buildNsfwBulkUpdate(items),
        );
      }
    } catch (error) {
      this.logger.error(
        'Unexpected error when updating nsfw with bulk request',
        {
          path: 'ElasticNsfwUpdaterService.updateNsfwForToken',
          exception: error?.message,
        },
      );
    }
  }

  private buildNsfwBulkUpdate(
    items: { identifier: string; nsfw: number }[],
  ): string {
    let updates: string = '';
    items.forEach((r) => {
      updates += this.buildBulkUpdateBody(
        'tokens',
        r.identifier,
        'nft_nsfw_mark',
        parseFloat(r.nsfw.toString()),
      );
    });
    return updates;
  }

  buildBulkUpdateBody(
    collection: string,
    identifier: string,
    fieldName: string,
    fieldValue: Number,
  ): string {
    return (
      JSON.stringify({
        update: {
          _id: identifier,
          _index: collection,
        },
      }) +
      '\n' +
      JSON.stringify({
        doc: {
          [fieldName]: fieldValue.toRounded(2),
        },
      }) +
      '\n'
    );
  }
}
