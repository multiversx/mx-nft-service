import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { MxElasticService } from 'src/common';
import { BatchUtils } from '@multiversx/sdk-nestjs-common';
import asyncPool from 'tiny-async-pool';
import { FlagNftService } from 'src/modules/admins/flag-nft.service';
import { CacheEventsPublisherService } from 'src/modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { ChangedEvent, CacheEventTypeEnum } from 'src/modules/rabbitmq/cache-invalidation/events/changed.event';
import { getNsfwMarkedQuery, getNsfwNotMarkedQuery } from './nsfw-queries';
import { constants } from 'src/config';
import { ELASTIC_NFT_NSFW, ELASTIC_TOKENS_INDEX } from 'src/utils/constants';

type NsfwType = {
  identifier: string;
  nsfw: any;
};

@Injectable()
export class NsfwUpdaterService {
  constructor(
    private elasticService: MxElasticService,
    private readonly cacheEventsPublisher: CacheEventsPublisherService,
    @Inject(forwardRef(() => FlagNftService))
    private flagsNftService: FlagNftService,
    private readonly logger: Logger,
  ) {}

  public async cleanReindexing() {
    await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'identifier', getNsfwNotMarkedQuery, async (items) => {
      const nsfwItems = items.map((item) => ({
        identifier: item.identifier,
        nsfw: item.nft_nsfw_mark,
      }));

      await this.validateNsfwValues(nsfwItems);
    });
  }

  public async validateNsfwFlags() {
    await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'identifier', getNsfwMarkedQuery, async (items) => {
      const nsfwItems = items.map((item) => ({
        identifier: item.identifier,
        nsfw: item.nft_nsfw_mark,
      }));

      await this.validateNsfwValues(nsfwItems);
    });
  }

  public async updateNsfwWhereNone() {
    await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'identifier', getNsfwNotMarkedQuery, async (items) => {
      const nsfwItems = items.map((item) => ({
        identifier: item.identifier,
        nsfw: item.nft_nsfw_mark,
      }));

      await this.updateNsfwForTokens(nsfwItems);
    });
  }

  private async updateNsfwForTokens(items: NsfwType[]): Promise<void> {
    const databaseResult = await BatchUtils.batchGet(
      items,
      (item) => item.identifier,
      async (elements) => await this.flagsNftService.getNftFlagsForIdentifiers(elements.map((x) => x.identifier)),
      constants.dbBatch,
    );
    const itemsToUpdate: NsfwType[] = [];
    for (const item of items) {
      if (!databaseResult || !databaseResult[item.identifier]) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        await this.flagsNftService.updateNftFlag(item.identifier);
      } else {
        const currentFlag = databaseResult[item.identifier].nsfw;
        const actualFlag = item.nsfw;

        if (actualFlag === undefined || parseFloat(currentFlag) !== parseFloat(actualFlag)) {
          itemsToUpdate.push({
            identifier: item.identifier,
            nsfw: currentFlag,
          });
        }
      }
    }

    await asyncPool(5, itemsToUpdate, async (item) => await this.updateNsfwForToken(item.identifier, item.nsfw));
  }

  private async validateNsfwValues(items: NsfwType[]): Promise<void> {
    const indexedItems = items.toRecord((item) => item.identifier);
    const databaseResult = await BatchUtils.batchGet(
      items,
      (item) => item.identifier,
      async (elements) => await this.flagsNftService.getNftFlagsForIdentifiers(elements.map((x) => x.identifier)),
      constants.dbBatch,
    );
    const itemsToUpdate: NsfwType[] = [];
    for (const identifier of Object.keys(databaseResult)) {
      const item: any = indexedItems[identifier];
      if (!item) {
        continue;
      }
      const currentFlag = databaseResult[item.identifier].nsfw;
      const actualFlag = item.nsfw;

      if (actualFlag === undefined || parseFloat(currentFlag) !== parseFloat(actualFlag)) {
        itemsToUpdate.push({
          identifier: item.identifier,
          nsfw: currentFlag,
        });
      }
    }

    this.logger.log('Bulk update nfts ', itemsToUpdate.length);
    await this.bulkUpdate(itemsToUpdate);
    await this.triggerMultipleInvalidation(itemsToUpdate.map((nft) => nft.identifier));
  }

  private async updateNsfwForToken(identifier: string, nsfw: number): Promise<void> {
    try {
      this.logger.log(`Setting nsfw for '${identifier}' with value ${nsfw}`);
      await this.elasticService.setCustomValue(
        ELASTIC_TOKENS_INDEX,
        identifier,
        this.elasticService.buildUpdateBody<number>(ELASTIC_NFT_NSFW, nsfw),
        '?retry_on_conflict=2',
      );
    } catch (error) {
      this.logger.error(`Unexpected error when updating nsfw for token with identifier '${identifier}'`, {
        identifier,
        path: 'ElasticNsfwUpdaterService.updateNsfwForToken',
        exception: error?.message,
      });
    }
  }

  public async bulkUpdate(items: NsfwType[]): Promise<void> {
    try {
      if (items && items.length > 0) {
        this.logger.log(`Updating NSFW flag`);
        await this.elasticService.bulkRequest(ELASTIC_TOKENS_INDEX, this.buildNsfwBulkUpdate(items));
      }
    } catch (error) {
      this.logger.error('Unexpected error when updating nsfw with bulk request', {
        path: 'ElasticNsfwUpdaterService.updateNsfwForToken',
        exception: error?.message,
      });
    }
  }

  private buildNsfwBulkUpdate(items: { identifier: string; nsfw: number }[]): string[] {
    let updates: string[] = [];
    items.forEach((r) => {
      updates.push(this.buildBulkUpdate(ELASTIC_TOKENS_INDEX, r.identifier, ELASTIC_NFT_NSFW, parseFloat(r.nsfw.toString())));
    });
    return updates;
  }

  buildBulkUpdate(collection: string, identifier: string, fieldName: string, fieldValue: Number): string {
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
    if (identifiers?.length) {
      await this.cacheEventsPublisher.publish(
        new ChangedEvent({
          id: identifiers,
          type: CacheEventTypeEnum.AssetsRefresh,
        }),
      );
    }
  }
}
