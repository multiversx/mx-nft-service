import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService, ElrondElasticService } from 'src/common';
import { constants, elasticDictionary } from 'src/config';
import { ElasticQuery, QueryType } from '@elrondnetwork/erdnest';
import { NftTypeEnum } from 'src/modules/assets/models';
import { Locker } from 'src/utils/locker';
import { NftScamService } from 'src/modules/nft-scam/nft-scam.service';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { ElrondApiAbout } from 'src/common/services/elrond-communication/models/elrond-api-about.model';
import { NftScamInfoModel } from 'src/modules/nft-scam/models/nft-scam-info.model';

@Injectable()
export class NftScamUpdaterService {
  constructor(
    private readonly nftScamService: NftScamService,
    private readonly elasticService: ElrondElasticService,
    private readonly elrondApiService: ElrondApiService,
    private readonly persistenceService: PersistenceService,
    private readonly logger: Logger,
  ) {}

  async handleUpdateScamInfoWhereNotSetOrOutdated(): Promise<void> {
    try {
      await Locker.lock(
        `handleUpdateScamInfoWhereNotSetOrOutdated`,
        async () => {
          const elrondApiAbout =
            await this.elrondApiService.getElrondApiAbout();

          await this.updateNftScamInfoWhereOutdatedVersionInDb(elrondApiAbout);

          await this.updateNftScamInfoWhereMissingInElastic(elrondApiAbout);
        },
        true,
      );
    } catch (error) {
      this.logger.error(
        `Error when setting/updating scam info where not set / outdated`,
        {
          path: `${NftScamUpdaterService.name}.${this.handleUpdateScamInfoWhereNotSetOrOutdated.name}`,
          exception: error?.message,
        },
      );
    }
  }

  private async updateNftScamInfoWhereOutdatedVersionInDb(
    elrondApiAbout: ElrondApiAbout,
  ): Promise<void> {
    let nfts: NftScamInfoModel[] = [];
    do {
      nfts = await this.persistenceService.getBulkOutdatedNftScamInfo(
        elrondApiAbout.version,
      );
      for (const nft of nfts) {
        await this.nftScamService.validateOrUpdateNftScamInfo(nft.identifier, {
          elrondApiAbout: elrondApiAbout,
          nftFromDb: nft,
        });
      }
    } while (nfts.length > 0);
  }

  private async updateNftScamInfoWhereMissingInElastic(
    elrondApiAbout: ElrondApiAbout,
  ): Promise<void> {
    const query = this.getNftWithScamInfoWhereNotSetElasticQuery();
    await this.elasticService.getScrollableList(
      'tokens',
      'token',
      query,
      async (nfts) => {
        for (const nft of nfts) {
          await this.nftScamService.validateOrUpdateNftScamInfo(
            nft.identifier,
            {
              elrondApiAbout: elrondApiAbout,
              nftFromElastic: nft,
            },
          );
        }
      },
    );
  }

  private getNftWithScamInfoWhereNotSetElasticQuery(): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('token')
      .withMustExistCondition('nonce')
      .withMustNotExistCondition(elasticDictionary.scamInfo.typeKey)
      .withMustMultiShouldCondition(
        [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
        (type) => QueryType.Match('type', type),
      )
      .withFields([
        'identifier',
        elasticDictionary.scamInfo.typeKey,
        elasticDictionary.scamInfo.infoKey,
      ])
      .withPagination({
        from: 0,
        size: constants.getCollectionsFromElasticBatchSize,
      });
  }
}
