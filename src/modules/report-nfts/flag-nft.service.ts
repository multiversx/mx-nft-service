import { Injectable, Logger } from '@nestjs/common';
import {
  ElrondApiService,
  ElrondElasticService,
  Nft,
  NftMedia,
} from 'src/common';
import { NftFlagsEntity, NftsFlagsRepository } from 'src/db/nftFlags';
import { VerifyContentService } from '../assets/verify-content.service';

@Injectable()
export class FlagNftService {
  constructor(
    private elrondApi: ElrondApiService,
    private verifyContent: VerifyContentService,
    private elasticUpdater: ElrondElasticService,
    private nftFlagsRepository: NftsFlagsRepository,
    private readonly logger: Logger,
  ) {}

  public async updateNftFlag(identifier: string) {
    try {
      const nft = await this.elrondApi.getNftByIdentifierForQuery(
        identifier,
        'fields=media',
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
      return true;
    } catch (error) {
      this.logger.error(
        `Unexpected error when updating nsfw for token with identifier '${identifier}'`,
      );
      return false;
    }
  }

  private getNftMedia(nft: Nft): NftMedia | undefined {
    if (!nft.media || nft.media.length === 0) {
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
      this.logger.error(
        'An error occurred while trying to get bulk nft flags',
        {
          path: 'FlagNftService.getNftFlagsForIdentifiers',
          exception: error,
        },
      );
    }
  }
}
