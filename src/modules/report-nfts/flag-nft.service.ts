import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { ElrondApiService, ElrondElasticService } from 'src/common';
import { NftFlagsEntity, NftsFlagsRepository } from 'src/db/nftFlags';
import { Logger } from 'winston';
import { VerifyContentService } from '../assets/verify-content.service';

@Injectable()
export class FlagNftService {
  constructor(
    private elrondApi: ElrondApiService,
    private verifyContent: VerifyContentService,
    private elasticUpdater: ElrondElasticService,
    private nftFlagsRepository: NftsFlagsRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  public async updateNftFlag(identifier: string) {
    try {
      const nft = await this.elrondApi.getNftByIdentifierForQuery(
        identifier,
        'fields=media',
      );
      if (nft && nft?.media && nft.media.length > 0) {
        const value = await this.verifyContent.checkContentSensitivityForUrl(
          nft?.media[0].url || nft?.media[0].originalUrl,
          nft?.media[0].fileType,
        );
        await this.nftFlagsRepository.addFlag(
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
      }
      return true;
    } catch (error) {
      return false;
    }
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
