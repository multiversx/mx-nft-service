import {
  BatchUtils,
  ElasticQuery,
  QueryOperator,
  QueryType,
} from '@elrondnetwork/erdnest';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { ElrondElasticService, NftMedia } from 'src/common';
import { NsfwUpdaterService } from 'src/crons/elastic.updater/nsfw.updater.service';
import { NftFlagsEntity, NftsFlagsRepository } from 'src/db/nftFlags';
import { AssetsRedisHandler, AssetByIdentifierService } from '../assets';
import { Asset, NftTypeEnum } from '../assets/models';
import { VerifyContentService } from '../assets/verify-content.service';
type NsfwType = {
  identifier: string;
  nsfw: any;
};

@Injectable()
export class FlagNftService {
  constructor(
    private assetByIdentifierService: AssetByIdentifierService,
    private verifyContent: VerifyContentService,
    private elasticUpdater: ElrondElasticService,
    private nftFlagsRepository: NftsFlagsRepository,
    @Inject(forwardRef(() => NsfwUpdaterService))
    private nsfwUpdateService: NsfwUpdaterService,
    private assetsRedisHandler: AssetsRedisHandler,
    private readonly logger: Logger,
  ) {}

  public async updateNftFlag(identifier: string) {
    try {
      const nft = await this.assetByIdentifierService.getAsset(identifier);

      const nftMedia = this.getNftMedia(nft);
      if (!nftMedia) {
        return false;
      }

      const value = await this.getNsfwValue(nftMedia, identifier);
      if (value) {
        await this.addNsfwFlag(identifier, value);
        this.assetsRedisHandler.clearKey(identifier);
      }
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

  public async updateCollectionNftsNSFWByAdmin(
    collection: string,
    value: number,
  ) {
    try {
      console.log({ collection });
      const query = ElasticQuery.create()
        .withMustExistCondition('identifier')
        .withMustCondition(
          QueryType.Match('token', collection, QueryOperator.AND),
        )
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
      await this.elasticUpdater.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (items) => {
          const nsfwItems = items.map((item) => ({
            identifier: item.identifier,
            nsfw: item.nft_nsfw_mark,
          }));

          await this.updateCollectionNfts(nsfwItems, value);
        },
      );
      return true;
    } catch (error) {
      this.logger.error(
        'An error occurred while updating NSFW for collection',
        {
          identifier: collection,
          path: 'FlagNftService.updateCollectionNftsNSFWByAdmin',
          exception: error?.message,
        },
      );
      return false;
    }
  }

  public async getNftFlagsForIdentifiers(identifiers: string[]) {
    try {
      return await this.nftFlagsRepository.batchGetFlags(identifiers);
    } catch (error) {
      this.logger.error('An error occurred while getting the flags from db', {
        path: 'FlagNftService.getNftFlagsForIdentifiers',
        exception: error?.message,
      });
    }
  }

  private async getNsfwValue(nftMedia: NftMedia, identifier: string) {
    try {
      return await this.verifyContent.checkContentSensitivityForUrl(
        nftMedia.url ?? nftMedia.originalUrl,
        nftMedia.fileType,
      );
    } catch (error) {
      this.logger.error(
        `An error occurred while calculating nsfw for url ${nftMedia.url} and type ${nftMedia.fileType}`,
        {
          path: 'FlagNftService.getNsfwValue',
          identifier,
          exception: error?.message,
        },
      );
      return 0.01;
    }
  }

  private async addNsfwFlag(identifier: string, value: number) {
    let savedValue = value.toRounded(2);
    if (savedValue === 0) {
      savedValue += 0.01;
    }
    this.logger.log(
      `Setting nsfw for '${identifier}' with value ${savedValue}`,
    );
    await this.nftFlagsRepository.addFlag(
      new NftFlagsEntity({
        identifier: identifier,
        nsfw: savedValue,
      }),
    );
    await this.elasticUpdater.setCustomValue(
      'tokens',
      identifier,
      this.elasticUpdater.buildUpdateBody<number>('nft_nsfw_mark', savedValue),
      '?retry_on_conflict=2',
    );
  }

  private async updateCollectionNfts(
    items: NsfwType[],
    value: number,
  ): Promise<void> {
    const size = 100;
    for (let i = 0; i < items.length; i += size) {
      let itemsToUpdate = items.slice(i, i + size);
      await this.nftFlagsRepository.upsertEntities(
        itemsToUpdate.map(
          (nft) =>
            new NftFlagsEntity({ identifier: nft.identifier, nsfw: value }),
        ),
      );
      await this.nsfwUpdateService.bulkUpdate(
        itemsToUpdate.map((i) => {
          return { identifier: i.identifier, nsfw: value };
        }),
      );
      await this.assetsRedisHandler.clearMultipleKeys(
        itemsToUpdate.map((nft) => nft.identifier),
      );
    }
  }

  public async updateNftNSFWByAdmin(identifier: string, value) {
    try {
      await this.nftFlagsRepository.update(
        { identifier: identifier },
        new NftFlagsEntity({
          identifier: identifier,
          nsfw: value.toRounded(2),
        }),
      );
      await this.elasticUpdater.setCustomValue(
        'tokens',
        identifier,
        this.elasticUpdater.buildUpdateBody<number>(
          'nft_nsfw_mark',
          value.toRounded(2),
        ),
        '?retry_on_conflict=2',
      );

      this.assetsRedisHandler.clearKey(identifier);
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

  private getNftMedia(nft: Asset): NftMedia | undefined {
    if (
      !nft ||
      !nft.media ||
      nft.media.length === 0 ||
      nft.isWhitelistedStorage === false
    ) {
      return undefined;
    }

    const media = nft.media[0];
    if (
      media.url.includes('default') ||
      media.originalUrl.includes('default')
    ) {
      return undefined;
    }

    return media;
  }
}
