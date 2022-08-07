import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ElrondElasticService } from 'src/common';
import { NftTypeEnum } from 'src/modules/assets/models';
import { BatchUtils, ElasticQuery, QueryType } from '@elrondnetwork/erdnest';
import asyncPool from 'tiny-async-pool';
import { FlagNftService } from 'src/modules/admins/flag-nft.service';
import { CacheEventsPublisherService } from 'src/modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import {
  CacheEventTypeEnum,
  ChangedEvent,
} from 'src/modules/rabbitmq/cache-invalidation/events/owner-changed.event';

type NsfwType = {
  identifier: string;
  nsfw: any;
};

@Injectable()
export class NsfwUpdaterService {
  constructor(
    private elasticService: ElrondElasticService,
    private readonly rabbitPublisherService: CacheEventsPublisherService,
    @Inject(forwardRef(() => FlagNftService))
    private flagsNftService: FlagNftService,
    private readonly logger: Logger,
  ) {}

  public async validateNsfwFlags() {
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
  }

  public async updateNsfwWhereNone() {
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
        await new Promise((resolve) => setTimeout(resolve, 50));
        await this.flagsNftService.updateNftFlag(item.identifier);
      } else {
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
    await this.triggerMultipleInvalidation(
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

  public async bulkUpdate(items: NsfwType[]): Promise<void> {
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
  ): string[] {
    let updates: string[] = [];
    items.forEach((r) => {
      updates.push(
        this.buildBulkUpdate(
          'tokens',
          r.identifier,
          'nft_nsfw_mark',
          parseFloat(r.nsfw.toString()),
        ),
      );
    });
    return updates;
  }

  buildBulkUpdate(
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
  private async triggerMultipleInvalidation(identifiers: string[]) {
    await this.rabbitPublisherService.publish(
      new ChangedEvent({
        id: identifiers,
        type: CacheEventTypeEnum.AssetsRefresh,
      }),
    );
  }
}
