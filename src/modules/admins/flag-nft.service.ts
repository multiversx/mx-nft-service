import { Injectable, Logger } from '@nestjs/common';
import {
  ElrondApiService,
  ElrondElasticService,
  Nft,
  NftMedia,
} from 'src/common';
import { NftFlagsEntity, NftsFlagsRepository } from 'src/db/nftFlags';
import { AssetsRedisHandler } from '../assets';
import { VerifyContentService } from '../assets/verify-content.service';

@Injectable()
export class FlagNftService {
  constructor(
    private elrondApi: ElrondApiService,
    private verifyContent: VerifyContentService,
    private elasticUpdater: ElrondElasticService,
    private nftFlagsRepository: NftsFlagsRepository,
    private assetsRedisHandler: AssetsRedisHandler,
    private readonly logger: Logger,
  ) {}

  public async updateNftFlag(identifier: string) {
    try {
      const nft = await this.elrondApi.getNftByIdentifierForQuery(
        identifier,
        'fields=media,isWhitelistedStorage',
      );

      const nftMedia = this.getNftMedia(nft);
      if (!nftMedia) {
        return false;
      }

      const value = await this.verifyContent.checkContentSensitivityForUrl(
        nftMedia.url ?? nftMedia.originalUrl,
        nftMedia.fileType,
      );
      await this.nftFlagsRepository.addFlag(
        new NftFlagsEntity({
          identifier: identifier,
          nsfw: value.toRounded(2),
        }),
      );
      await this.elasticUpdater.setCustomValue(
        'tokens',
        identifier,
        this.elasticUpdater.buildUpdateBody('nft_nsfw', value.toRounded(2)),
      );
      this.assetsRedisHandler.clearKey(identifier);
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

  public async updateNftNSFWByAdmin(identifier: string, value) {
    try {
      await this.nftFlagsRepository.update(
        { identifier: identifier },
        new NftFlagsEntity({
          identifier: identifier,
          nsfw: Number(value.toFixed(2)),
        }),
      );
      await this.elasticUpdater.setCustomValue(
        'tokens',
        identifier,
        this.elasticUpdater.buildUpdateBody(
          'nft_nsfw',
          Number(value.toFixed(2)),
        ),
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

  private getNftMedia(nft: Nft): NftMedia | undefined {
    if (
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
}
