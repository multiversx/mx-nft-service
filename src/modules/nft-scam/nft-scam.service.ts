import { Injectable, Logger } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { ElrondApiService, ElrondElasticService, Nft } from 'src/common';
import { ElrondApiAbout } from 'src/common/services/elrond-communication/models/elrond-api-about.model';
import { ElasticQuery, QueryOperator, QueryType } from '@elrondnetwork/erdnest';
import { constants } from 'src/config';
import { Locker } from 'src/utils/locker';
import { ScamInfo } from '../assets/models/ScamInfo.dto';
import { ScamInfoTypeEnum } from '../assets/models';
import { NftScamEntity } from 'src/db/reports-nft-scam';

@Injectable()
export class NftScamService {
  constructor(
    private persistenceService: PersistenceService,
    private elasticService: ElrondElasticService,
    private elrondApiService: ElrondApiService,
    private readonly logger: Logger,
  ) {}

  async validateOrUpdateNftScamInfo(
    identifier: string,
    optionalParams?: {
      elrondApiAbout?: ElrondApiAbout;
      nftFromApi?: Nft;
      nftFromElastic?: any;
      nftFromDb?: NftScamEntity;
    },
  ): Promise<boolean> {
    const [nftFromApi, nftFromElastic, nftFromDb, elrondApiAbout]: [
      Nft,
      any,
      NftScamEntity,
      ElrondApiAbout,
    ] = await this.getNftsAndElrondAbout(identifier, optionalParams);

    if (!nftFromApi.scamInfo) {
      const setScamInfoNullInElastic = nftFromElastic.nft_scamInfoType;
      const updateScamInfoInElastic =
        setScamInfoNullInElastic ||
        nftFromElastic.nft_scamInfoVersion !== elrondApiAbout.version;
      const updateScamInfoInDb = !nftFromDb || nftFromDb.type !== undefined;
      if (updateScamInfoInElastic || updateScamInfoInDb) {
        await Promise.all([
          updateScamInfoInDb
            ? this.persistenceService.saveOrUpdateNftScamInfo(
                nftFromApi.identifier,
                elrondApiAbout.version,
              )
            : undefined,
          updateScamInfoInElastic
            ? this.setBulkNftScamInfoInElastic(
                [nftFromApi],
                elrondApiAbout.version,
                setScamInfoNullInElastic,
              )
            : undefined,
        ]);

        this.logger.log(
          `${nftFromApi.identifier} - SCAM Info cleared / version saved`,
        );
        return true;
      }
    }

    if (nftFromApi.scamInfo) {
      const isElasticScamInfoDifferent =
        ScamInfo.areApiAndElasticScamInfoDifferent(
          nftFromApi,
          nftFromElastic,
          elrondApiAbout.version,
        );
      const isDbScamInfoDifferent = ScamInfo.areApiAndDbScamInfoDifferent(
        nftFromApi,
        nftFromDb,
        elrondApiAbout.version,
      );

      if (isElasticScamInfoDifferent || isDbScamInfoDifferent) {
        await Promise.all([
          isDbScamInfoDifferent
            ? this.persistenceService.saveOrUpdateNftScamInfo(
                nftFromApi.identifier,
                elrondApiAbout.version,
                new ScamInfo({
                  type: ScamInfoTypeEnum[nftFromApi.scamInfo.type],
                  info: nftFromApi.scamInfo.info,
                }),
              )
            : undefined,
          isElasticScamInfoDifferent
            ? this.setBulkNftScamInfoInElastic(
                [nftFromApi],
                elrondApiAbout.version,
                true,
              )
            : undefined,
        ]);
        this.logger.log(`${nftFromApi.identifier} - SCAM info updated`);
        return true;
      }
    }

    return false;
  }

  async getNftsAndElrondAbout(
    identifier: string,
    optionalParams?: {
      elrondApiAbout?: ElrondApiAbout;
      nftFromApi?: Nft;
      nftFromElastic?: any;
      nftFromDb?: NftScamEntity;
    },
  ): Promise<[Nft, any, NftScamEntity, ElrondApiAbout]> {
    return await Promise.all([
      optionalParams?.nftFromApi ??
        this.elrondApiService.getNftScamInfo(identifier, true),
      optionalParams?.nftFromElastic ??
        this.getNftWithScamInfoFromElastic(identifier),
      optionalParams?.nftFromDb ??
        this.persistenceService.getNftScamInfo(identifier),
      optionalParams?.elrondApiAbout ??
        this.elrondApiService.getElrondApiAbout(),
    ]);
  }

  async validateOrUpdateAllNftsScamInfo(): Promise<void> {
    await Locker.lock(
      'updateAllNftsScamInfos: Update scam info for all existing NFTs',
      async () => {
        try {
          const query = this.getAllNftsWithScamInfoFromElasticQuery();
          const apiBatchSize = constants.getTokensFromApiBatchSize;
          const elrondApiAbout =
            await this.elrondApiService.getElrondApiAbout();

          let totalProcessedScamInfo = 0;

          await this.elasticService.getScrollableList(
            'tokens',
            'identifier',
            query,
            async (nftsBatch) => {
              for (let i = 0; i < nftsBatch.length; i += apiBatchSize) {
                await this.validateOrUpdateNftsScamInfoBatch(
                  nftsBatch.slice(i, i + apiBatchSize),
                  elrondApiAbout,
                );
              }
              totalProcessedScamInfo += nftsBatch.length;
            },
          );

          this.logger.log(
            `Processed NFT Scam for ${totalProcessedScamInfo} NFTs`,
            {
              path: `${NftScamService.name}.${this.validateOrUpdateAllNftsScamInfo.name}`,
            },
          );
        } catch (error) {
          this.logger.error(
            'Error when updating/validating scam info for all NFTs',
            {
              path: `${NftScamService.name}.${this.validateOrUpdateAllNftsScamInfo.name}`,
              exception: error?.message,
            },
          );
        }
      },
      true,
    );
  }

  private async validateOrUpdateNftsScamInfoBatch(
    nftsFromElastic: any,
    elrondApiAbout: ElrondApiAbout,
  ): Promise<void> {
    let nftsWithoutScamOutdatedInElastic: string[] = [];
    let nftsWithScamOutdatedInElastic: Nft[] = [];
    let nftsOutdatedOrMissingFromDb: Nft[] = [];

    const identifiers = nftsFromElastic.map((nft) => nft.identifier);

    const [nftsFromApi, nftsFromDb]: [Nft[], NftScamEntity[]] =
      await Promise.all([
        this.elrondApiService.getBulkNftScamInfo(identifiers, true),
        this.persistenceService.getBulkNftScamInfo(identifiers),
      ]);

    for (const nftFromApi of nftsFromApi) {
      const nftFromElastic = nftsFromElastic.find(
        (nft) => nft.identifier === nftFromApi.identifier,
      );
      const nftFromDb = nftsFromDb?.find(
        (nft) => nft.identifier === nftFromApi.identifier,
      );

      if (!nftFromApi.scamInfo) {
        const updateScamInfoInElastic =
          nftFromElastic.nft_scamInfoType !== undefined;
        const updateScamInfoInDb = !nftFromDb || nftFromDb.type !== undefined;
        if (updateScamInfoInElastic || updateScamInfoInDb) {
          if (updateScamInfoInElastic) {
            nftsWithoutScamOutdatedInElastic.push(nftFromApi.identifier);
          }
          if (updateScamInfoInDb) {
            nftsOutdatedOrMissingFromDb.push(nftFromApi);
          }

          this.logger.log(
            `${nftFromApi.identifier} - SCAM Info cleared / version saved`,
          );
        }
      }

      if (nftFromApi.scamInfo) {
        const isElasticScamInfoDifferent =
          ScamInfo.areApiAndElasticScamInfoDifferent(
            nftFromApi,
            nftFromElastic,
            elrondApiAbout.version,
          );

        const isDbScamInfoDifferent = ScamInfo.areApiAndDbScamInfoDifferent(
          nftFromApi,
          nftFromDb,
          elrondApiAbout.version,
        );

        if (isElasticScamInfoDifferent || isDbScamInfoDifferent) {
          if (isElasticScamInfoDifferent) {
            nftsWithScamOutdatedInElastic.push(nftFromApi);
          }
          if (isDbScamInfoDifferent) {
            nftsOutdatedOrMissingFromDb.push(nftFromApi);
          }
          this.logger.log(`${nftFromApi.identifier} - SCAM info updated`);
        }
      }
    }

    const elasticUpdates = this.buildNftScamInfoBulkUpdate(
      nftsWithoutScamOutdatedInElastic,
      elrondApiAbout.version,
      true,
    ).concat(
      this.buildNftScamInfoBulkUpdate(
        nftsWithScamOutdatedInElastic,
        elrondApiAbout.version,
      ),
    );

    await Promise.all([
      this.updateBulkNftScamInfoInElastic(elasticUpdates),
      this.persistenceService.saveOrUpdateBulkNftScamInfo(
        nftsOutdatedOrMissingFromDb,
        elrondApiAbout.version,
      ),
    ]);
  }

  async manuallySetNftScamInfo(
    identifier: string,
    type: ScamInfoTypeEnum,
    info: string,
  ): Promise<boolean> {
    await Promise.all([
      this.persistenceService.saveOrUpdateNftScamInfo(
        identifier,
        'manual',
        new ScamInfo({
          type: ScamInfoTypeEnum[type],
          info: info,
        }),
      ),
      this.setNftScamInfoInElastic(identifier, type, info),
    ]);

    return true;
  }

  private async getNftWithScamInfoFromElastic(
    identifier: string,
  ): Promise<any> {
    let nft: any;
    try {
      const query = this.getNftWithScamInfoFromElasticQuery(identifier);

      await this.elasticService.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (items) => {
          nft = items[0];
          return undefined;
        },
      );
    } catch (error) {
      this.logger.error(`Error when getting NFT trait values from Elastic`, {
        path: `${NftScamService.name}.${this.getNftWithScamInfoFromElastic.name}`,
        exception: error?.message,
        identifier: identifier,
      });
    }
    return nft;
  }

  async setBulkNftScamInfoInElastic(
    nfts: Nft[] | string[],
    version: string,
    clearScamInfoIfEmpty?: boolean,
  ): Promise<void> {
    if (nfts.length > 0) {
      try {
        await this.elasticService.bulkRequest(
          'tokens',
          this.buildNftScamInfoBulkUpdate(nfts, version, clearScamInfoIfEmpty),
        );
      } catch (error) {
        this.logger.error('Error when bulk updating nft scam info in Elastic', {
          path: `${NftScamService.name}.${this.setBulkNftScamInfoInElastic.name}`,
          exception: error?.message,
        });
      }
    }
  }

  async setNftScamInfoInElastic(
    identifier: string,
    type: ScamInfoTypeEnum,
    info: string,
  ): Promise<void> {
    try {
      const updates = [
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          identifier,
          'nft_scamInfoVersion',
          'manual',
        ),
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          identifier,
          'nft_scamInfoType',
          type,
        ),
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          identifier,
          'nft_scamInfoDescription',
          info,
        ),
      ];
      await this.elasticService.bulkRequest('tokens', updates);
    } catch (error) {
      this.logger.error(
        'Error when manually setting nft scam info in Elastic',
        {
          path: `${NftScamService.name}.${this.setNftScamInfoInElastic.name}`,
          exception: error?.message,
        },
      );
    }
  }

  async updateBulkNftScamInfoInElastic(updates: string[]): Promise<void> {
    if (updates.length > 0) {
      try {
        await this.elasticService.bulkRequest('tokens', updates, '?timeout=1m');
      } catch (error) {
        this.logger.error('Error when bulk updating nft scam info in Elastic', {
          path: `${NftScamService.name}.${this.updateBulkNftScamInfoInElastic.name}`,
          exception: error?.message,
        });
      }
    }
  }

  private buildNftScamInfoBulkUpdate(
    nfts: Nft[] | string[],
    version: string,
    clearScamInfoIfEmpty?: boolean,
  ): string[] {
    let updates: string[] = [];
    nfts.forEach((nft) => {
      updates.push(
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          nft.identifier ?? nft,
          'nft_scamInfoVersion',
          version,
        ),
      );
      if (nft.scamInfo) {
        updates.push(
          this.elasticService.buildBulkUpdate<string>(
            'tokens',
            nft.identifier,
            'nft_scamInfoType',
            nft.scamInfo.type,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<string>(
            'tokens',
            nft.identifier,
            'nft_scamInfoDescription',
            nft.scamInfo.info,
          ),
        );
      } else if (clearScamInfoIfEmpty) {
        updates.push(
          this.elasticService.buildBulkUpdate<string>(
            'tokens',
            nft.identifier ?? nft,
            'nft_scamInfoType',
            null,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<string>(
            'tokens',
            nft.identifier ?? nft,
            'nft_scamInfoDescription',
            null,
          ),
        );
      }
    });
    return updates;
  }

  private getAllNftsWithScamInfoFromElasticQuery(): ElasticQuery {
    let query = ElasticQuery.create()
      .withMustExistCondition('nonce')
      .withFields([
        'nft_scamInfoVersion',
        'nft_scamInfoType',
        'nft_scamInfoDescription',
      ])
      .withPagination({
        from: 0,
        size: constants.getNftsFromElasticBatchSize,
      });
    return query;
  }

  private getNftWithScamInfoFromElasticQuery(identifier: string): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('nonce')
      .withMustCondition(
        QueryType.Match('identifier', identifier, QueryOperator.AND),
      )
      .withFields([
        'nft_scamInfoVersion',
        'nft_scamInfoType',
        'nft_scamInfoDescription',
      ])
      .withPagination({
        from: 0,
        size: 1,
      });
  }
}
