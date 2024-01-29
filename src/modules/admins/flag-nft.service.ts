import { ElasticQuery, MatchQuery, QueryOperator, QueryType } from '@multiversx/sdk-nestjs-elastic';
import { Locker } from '@multiversx/sdk-nestjs-common';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { MxElasticService, NftMedia } from 'src/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { NsfwUpdaterService } from 'src/crons/elastic.updater/nsfw.updater.service';
import { NftFlagsEntity } from 'src/db/nftFlags';
import { AssetByIdentifierService } from '../assets';
import { Asset, NftTypeEnum } from '../assets/models';
import { VerifyContentService } from '../assets/verify-content.service';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { CacheEventTypeEnum, ChangedEvent } from '../rabbitmq/cache-invalidation/events/changed.event';
import { ELASTIC_NFT_NSFW, ELASTIC_TOKENS_INDEX } from 'src/utils/constants';
type NsfwType = {
  identifier: string;
  nsfw: any;
};

@Injectable()
export class FlagNftService {
  constructor(
    private assetByIdentifierService: AssetByIdentifierService,
    private verifyContent: VerifyContentService,
    private elasticUpdater: MxElasticService,
    private persistenceService: PersistenceService,
    @Inject(forwardRef(() => NsfwUpdaterService))
    private nsfwUpdateService: NsfwUpdaterService,
    private readonly cacheEventPublisherService: CacheEventsPublisherService,
    private readonly logger: Logger,
  ) {
    this.setElasticNftFlagMapping();
  }

  public async updateNftFlag(identifier: string) {
    try {
      const nft = await this.assetByIdentifierService.getAsset(identifier);

      const nftMedia = this.getNftMedia(nft);
      if (!nftMedia) {
        this.logger.log(`No media exists for ${identifier}`);
        return false;
      }

      let value = 0;
      if (nftMedia.fileType.includes('image')) {
        value = await this.getNsfwValue(nftMedia, identifier);
      }

      await this.addNsfwFlag(identifier, value);
      this.triggerCacheInvalidation(identifier, nft?.ownerAddress);

      return true;
    } catch (error) {
      this.logger.error('An error occurred while updating NSFW for nft', {
        identifier,
        path: 'FlagNftService.updateNftFlag',
        exception: error?.message,
      });
      return false;
    }
  }

  public async updateCollectionNftsNSFWByAdmin(collection: string, value: number) {
    try {
      this.logger.log(`Setting nsfw for collection '${collection}' with value ${value}`);
      const query = ElasticQuery.create()
        .withMustExistCondition('identifier')
        .withMustCondition(QueryType.Match('token', collection, QueryOperator.AND))
        .withMustMultiShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT], (type) => QueryType.Match('type', type))
        .withMustCondition(QueryType.Nested('data', [new MatchQuery('data.nonEmptyURIs', true)]))
        .withPagination({ from: 0, size: 10000 });
      await this.elasticUpdater.getScrollableList(ELASTIC_TOKENS_INDEX, 'identifier', query, async (items) => {
        const nsfwItems = items.map((item) => ({
          identifier: item.identifier,
          nsfw: item.nft_nsfw_mark,
        }));

        await this.updateCollectionNfts(nsfwItems, value);
      });
      return true;
    } catch (error) {
      this.logger.error('An error occurred while updating NSFW for collection', {
        identifier: collection,
        path: 'FlagNftService.updateCollectionNftsNSFWByAdmin',
        exception: error?.message,
      });
      return false;
    }
  }

  public async getNftFlagsForIdentifiers(identifiers: string[]) {
    try {
      return await this.persistenceService.batchGetFlags(identifiers);
    } catch (error) {
      this.logger.error('An error occurred while getting the flags from db', {
        path: 'FlagNftService.getNftFlagsForIdentifiers',
        exception: error?.message,
      });
    }
  }

  private async getNsfwValue(nftMedia: NftMedia, identifier: string) {
    try {
      return await this.verifyContent.checkContentSensitivityForUrl(nftMedia.url ?? nftMedia.originalUrl, nftMedia.fileType);
    } catch (error) {
      this.logger.error(`An error occurred while calculating nsfw for url ${nftMedia.url} and type ${nftMedia.fileType}`, {
        path: 'FlagNftService.getNsfwValue',
        identifier,
        exception: error?.message,
      });
      return 0.01;
    }
  }

  private async addNsfwFlag(identifier: string, value: number) {
    let savedValue = value.toRounded(2);
    if (savedValue === 0) {
      savedValue += 0.01;
    }
    this.logger.log(`Setting nsfw for '${identifier}' with value ${savedValue}`);
    await this.persistenceService.addFlag(
      new NftFlagsEntity({
        identifier: identifier,
        nsfw: savedValue,
      }),
    );
    await this.elasticUpdater.setCustomValue(
      ELASTIC_TOKENS_INDEX,
      identifier,
      this.elasticUpdater.buildUpdateBody<number>(ELASTIC_NFT_NSFW, savedValue),
      '?retry_on_conflict=2',
    );
  }

  private async updateCollectionNfts(items: NsfwType[], value: number): Promise<void> {
    const size = 100;
    for (let i = 0; i < items.length; i += size) {
      let itemsToUpdate = items.slice(i, i + size);
      await this.persistenceService.upsertFlags(
        itemsToUpdate.map((nft) => new NftFlagsEntity({ identifier: nft.identifier, nsfw: value })),
      );
      await this.nsfwUpdateService.bulkUpdate(
        itemsToUpdate.map((i) => {
          return { identifier: i.identifier, nsfw: value };
        }),
      );
      await this.triggerMultipleInvalidation(itemsToUpdate.map((nft) => nft.identifier));
    }
  }

  public async updateNftNSFWByAdmin(identifier: string, value) {
    try {
      this.logger.log(`Setting nsfw for '${identifier}' with value ${value}`);
      const nft = await this.assetByIdentifierService.getAsset(identifier);
      await this.persistenceService.updateFlag(
        new NftFlagsEntity({
          identifier: identifier,
          nsfw: value.toRounded(2),
        }),
      );
      await this.elasticUpdater.setCustomValue(
        ELASTIC_TOKENS_INDEX,
        identifier,
        this.elasticUpdater.buildUpdateBody<number>(ELASTIC_NFT_NSFW, value.toRounded(2)),
        '?retry_on_conflict=2',
      );

      await this.triggerCacheInvalidation(identifier, nft?.ownerAddress);
      return true;
    } catch (error) {
      this.logger.error('An error occurred while updating NSFW', {
        identifier,
        value,
        path: 'FlagNftService.updateNftNSFWByAdmin',
        exception: error?.message,
      });

      return false;
    }
  }

  private async triggerCacheInvalidation(identifier: string, ownerAddress: string) {
    await this.cacheEventPublisherService.publish(
      new ChangedEvent({
        id: identifier,
        type: CacheEventTypeEnum.AssetRefresh,
        address: ownerAddress,
      }),
    );
  }

  private async triggerMultipleInvalidation(identifiers: string[]) {
    if (identifiers?.length) {
      await this.cacheEventPublisherService.publish(
        new ChangedEvent({
          id: identifiers,
          type: CacheEventTypeEnum.AssetsRefresh,
        }),
      );
    }
  }

  private getNftMedia(nft: Asset): NftMedia | undefined {
    if (!nft || !nft.media || nft.media.length === 0) {
      return undefined;
    }

    const media = nft.media[0];
    if (media.url.includes('default') || media.originalUrl.includes('default')) {
      return undefined;
    }

    return media;
  }

  private async setElasticNftFlagMapping(): Promise<void> {
    if (process.env.ENABLE_ELASTIC_UPDATES === 'true') {
      await Locker.lock(
        'setElasticNftFlagMapping',
        async () => {
          try {
            await this.elasticUpdater.putMappings(
              ELASTIC_TOKENS_INDEX,
              this.elasticUpdater.buildPutMultipleMappingsBody([
                {
                  key: ELASTIC_NFT_NSFW,
                  value: 'float',
                },
              ]),
            );
          } catch (error) {
            this.logger.error('Error when trying to map nsfw Elastic types', {
              path: `$${FlagNftService.name}.${this.setElasticNftFlagMapping.name}`,
            });
          }
        },
        false,
      );
    }
  }
}
