import { Injectable, Logger } from '@nestjs/common';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { ElrondApiService, ElrondElasticService, Nft } from 'src/common';
import { ElrondApiAbout } from 'src/common/services/elrond-communication/models/elrond-api-about.model';
import { Locker } from 'src/utils/locker';
import { ScamInfo } from '../assets/models/ScamInfo.dto';
import { ScamInfoTypeEnum } from '../assets/models';
import { NftScamElasticService } from './nft-scam.elastic.service';
import { NftScamRelatedData } from './models/nft-scam-data.model';
import { elasticDictionary } from 'src/config';
import { NftScamInfoModel } from './models/nft-scam-info.model';

@Injectable()
export class NftScamService {
  constructor(
    private persistenceService: PersistenceService,
    private nftScamElasticService: NftScamElasticService,
    private elrondElasticService: ElrondElasticService,
    private elrondApiService: ElrondApiService,
    private readonly logger: Logger,
  ) {}

  async validateOrUpdateNftScamInfo(
    identifier: string,
    nftScamRelatedData?: NftScamRelatedData,
    clearManualScamInfo: boolean = false,
  ): Promise<boolean> {
    console.log(identifier);
    const [nftFromApi, nftFromElastic, nftFromDb, elrondApiAbout]: [
      Nft,
      any,
      NftScamInfoModel,
      ElrondApiAbout,
    ] = await this.getNftsAndElrondAbout(identifier, nftScamRelatedData);

    console.log(nftFromApi);
    console.log(nftFromElastic);
    console.log(nftFromDb);

    // nftFromApi.scamInfo = {
    //   type: 'scam',
    //   info: 'test',
    // };

    if (
      nftFromDb?.version === elasticDictionary.scamInfo.manualVersionValue &&
      !clearManualScamInfo
    ) {
      if (!nftFromElastic[elasticDictionary.scamInfo.typeKey]) {
        await this.nftScamElasticService.setBulkNftScamInfoInElastic(
          [nftFromApi],
          true,
        );
      }
      return true;
    }

    if (!nftFromApi.scamInfo) {
      await this.validateOrUpdateScamInfoDataForNoScamNft(
        elrondApiAbout,
        nftFromApi,
        nftFromElastic,
        nftFromDb,
      );
    } else if (nftFromApi.scamInfo) {
      await this.validateOrUpdateScamInfoDataForScamNft(
        elrondApiAbout,
        nftFromApi,
        nftFromElastic,
        nftFromDb,
      );
    }

    return true;
  }

  async getNftsAndElrondAbout(
    identifier: string,
    nftScamRelatedData?: NftScamRelatedData,
  ): Promise<[Nft, any, NftScamInfoModel, ElrondApiAbout]> {
    return await Promise.all([
      nftScamRelatedData?.nftFromApi ??
        this.elrondApiService.getNftScamInfo(identifier, true),
      nftScamRelatedData?.nftFromElastic ??
        this.nftScamElasticService.getNftWithScamInfoFromElastic(identifier),
      nftScamRelatedData?.nftFromDb ??
        this.persistenceService.getNftScamInfo(identifier),
      nftScamRelatedData?.elrondApiAbout ??
        this.elrondApiService.getElrondApiAbout(),
    ]);
  }

  async validateOrUpdateAllNftsScamInfo(): Promise<void> {
    await Locker.lock(
      'updateAllNftsScamInfos: Update scam info for all existing NFTs',
      async () => {
        try {
          const elrondApiAbout =
            await this.elrondApiService.getElrondApiAbout();

          const collections =
            await this.nftScamElasticService.getAllCollectionsFromElastic();

          for (let i = 0; i < collections.length; i++) {
            await this.validateOrUpdateAllNftsScamInfForCollection(
              collections[i],
              elrondApiAbout,
            );
          }

          this.logger.log(`Processed NFT Scam for ${collections.length} collections`, {
            path: `${NftScamService.name}.${this.validateOrUpdateAllNftsScamInfo.name}`,
          });
        } catch (error) {
          this.logger.error(
            `Error when updating/validating scam info for all collections`,
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

  async validateOrUpdateAllNftsScamInfForCollection(
    collection: string,
    elrondApiAbout: ElrondApiAbout,
  ): Promise<void> {
    this.logger.log(`Processing scamInfo for ${collection}...`, {
      path: `${NftScamService.name}.${this.validateOrUpdateAllNftsScamInfForCollection.name}`,
    });
    const nftsQuery =
      this.nftScamElasticService.getAllCollectionNftsFromElasticQuery(
        collection,
      );
    await this.elrondElasticService.getScrollableList(
      'tokens',
      'identifier',
      nftsQuery,
      async (nftsBatch) => {
        await this.validateOrUpdateNftsScamInfoBatch(nftsBatch, elrondApiAbout);
      },
    );
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
      this.nftScamElasticService.setNftScamInfoManuallyInElastic(
        identifier,
        type,
        info,
      ),
    ]);
    return true;
  }

  async manuallyClearNftScamInfo(identifier: string): Promise<boolean> {
    return await this.validateOrUpdateNftScamInfo(identifier, {}, true);
  }

  private async validateOrUpdateScamInfoDataForNoScamNft(
    elrondApiAbout: ElrondApiAbout,
    nftFromApi: Nft,
    nftFromElastic: any,
    nftFromDb: NftScamInfoModel,
  ): Promise<void> {
    const clearScamInfoInElastic =
      nftFromElastic[elasticDictionary.scamInfo.typeKey] !== null;
    const updateScamInfoInElastic =
      clearScamInfoInElastic ||
      nftFromElastic[elasticDictionary.scamInfo.typeKey] !== null;
    const updateScamInfoInDb = !nftFromDb || nftFromDb.type;

    let updatePromises = [];

    console.log(
      clearScamInfoInElastic,
      updateScamInfoInElastic,
      updateScamInfoInDb,
    );

    if (updateScamInfoInDb) {
      updatePromises.push(
        this.persistenceService.saveOrUpdateNftScamInfo(
          nftFromApi.identifier,
          elrondApiAbout.version,
        ),
      );
    }
    if (updateScamInfoInElastic) {
      updatePromises.push(
        this.nftScamElasticService.setBulkNftScamInfoInElastic(
          [nftFromApi],
          clearScamInfoInElastic,
        ),
      );
    }

    await Promise.all(updatePromises);
  }

  private async validateOrUpdateScamInfoDataForScamNft(
    elrondApiAbout: ElrondApiAbout,
    nftFromApi: Nft,
    nftFromElastic: any,
    nftFromDb: NftScamInfoModel,
  ): Promise<void> {
    const isElasticScamInfoDifferent =
      ScamInfo.areApiAndElasticScamInfoDifferent(nftFromApi, nftFromElastic);
    const isDbScamInfoDifferent = ScamInfo.areApiAndDbScamInfoDifferent(
      nftFromApi,
      nftFromDb,
      elrondApiAbout.version,
    );

    //console.log(isElasticScamInfoDifferent, isDbScamInfoDifferent);

    let updatePromises = [];

    if (isDbScamInfoDifferent) {
      updatePromises.push(
        this.persistenceService.saveOrUpdateNftScamInfo(
          nftFromApi.identifier,
          elrondApiAbout.version,
          new ScamInfo({
            type: ScamInfoTypeEnum[nftFromApi.scamInfo.type],
            info: nftFromApi.scamInfo.info,
          }),
        ),
      );
    }
    if (isElasticScamInfoDifferent) {
      updatePromises.push(
        this.nftScamElasticService.setBulkNftScamInfoInElastic(
          [nftFromApi],
          true,
        ),
      );
    }

    await Promise.all(updatePromises);
  }

  private async validateOrUpdateNftsScamInfoBatch(
    nftsFromElastic: any,
    elrondApiAbout: ElrondApiAbout,
  ): Promise<void> {
    if (!nftsFromElastic || nftsFromElastic.length === 0) {
      return;
    }

    const [
      nftsNoScamOutdatedInElastic,
      nftsScamOutdatedInElastic,
      nftsManualScamInfoMissingInElastic,
      nftsOutdatedOrMissingFromDb,
    ] = await this.filterOutdatedNfts(nftsFromElastic, elrondApiAbout);

    console.log(nftsNoScamOutdatedInElastic.map((nft) => nft.identifier));
    console.log(nftsScamOutdatedInElastic.map((nft) => nft.identifier));
    console.log(
      nftsManualScamInfoMissingInElastic.map((nft) => nft.identifier),
    );
    console.log(nftsOutdatedOrMissingFromDb.map((nft) => nft.identifier));
    console.log('-------------------------------------');

    const elasticUpdates = this.nftScamElasticService
      .buildNftScamInfoBulkUpdate(nftsScamOutdatedInElastic, true)
      .concat(
        this.nftScamElasticService.buildNftScamInfoBulkUpdate(
          nftsNoScamOutdatedInElastic,
          true,
        ),
      )
      .concat(
        this.nftScamElasticService.buildNftScamInfoDbToElasticBulkUpdate(
          nftsManualScamInfoMissingInElastic,
        ),
      );

    await Promise.all([
      this.nftScamElasticService.updateBulkNftScamInfoInElastic(elasticUpdates),
      this.persistenceService.saveOrUpdateBulkNftScamInfoVersion(
        nftsOutdatedOrMissingFromDb,
        elrondApiAbout.version,
      ),
    ]);
  }

  private async filterOutdatedNfts(
    nftsFromElastic: any,
    elrondApiAbout: ElrondApiAbout,
  ): Promise<[Nft[], Nft[], NftScamInfoModel[], Nft[]]> {
    let nftsNoScamOutdatedInElastic: Nft[] = [];
    let nftsScamOutdatedInElastic: Nft[] = [];
    let nftsManualScamInfoMissingInElastic: NftScamInfoModel[] = [];
    let nftsOutdatedOrMissingFromDb: Nft[] = [];

    const identifiers = nftsFromElastic.map((nft) => nft.identifier);

    const [nftsFromApi, nftsFromDb]: [Nft[], NftScamInfoModel[]] =
      await Promise.all([
        this.elrondApiService.getBulkNftScamInfo(identifiers, true),
        this.persistenceService.getBulkNftScamInfo(identifiers),
      ]);

    if (!nftsFromApi || nftsFromApi.length === 0) {
      return;
    }

    for (let i = 0; i < nftsFromApi?.length; i++) {
      const nftFromApi = nftsFromApi[i];
      let nftFromElastic = nftsFromElastic.find(
        (nft) => nft.identifier === nftFromApi.identifier,
      );
      const nftFromDb = nftsFromDb?.find(
        (nft) => nft.identifier === nftFromApi.identifier,
      );

      if (
        nftFromDb?.version === elasticDictionary.scamInfo.manualVersionValue
      ) {
        if (nftFromElastic[elasticDictionary.scamInfo.typeKey] === undefined) {
          nftsManualScamInfoMissingInElastic.push(nftFromDb);
        }
        continue;
      }

      if (!nftFromApi.scamInfo) {
        const updateScamInfoInElastic =
          nftFromElastic[elasticDictionary.scamInfo.typeKey] !== null;
        const updateScamInfoInDb =
          !nftFromDb ||
          nftFromDb?.type !== null ||
          nftFromDb?.version !== elrondApiAbout.version;

        if (updateScamInfoInElastic) {
          nftsNoScamOutdatedInElastic.push(nftFromApi);
        }
        if (updateScamInfoInDb) {
          nftsOutdatedOrMissingFromDb.push(nftFromApi);
        }
      } else if (nftFromApi.scamInfo) {
        const isElasticScamInfoDifferent =
          ScamInfo.areApiAndElasticScamInfoDifferent(
            nftFromApi,
            nftFromElastic,
          );

        const isDbScamInfoDifferent = ScamInfo.areApiAndDbScamInfoDifferent(
          nftFromApi,
          nftFromDb,
          elrondApiAbout.version,
        );

        if (isElasticScamInfoDifferent) {
          nftsScamOutdatedInElastic.push(nftFromApi);
        }
        if (isDbScamInfoDifferent) {
          nftsOutdatedOrMissingFromDb.push(nftFromApi);
        }
      }
    }

    return [
      nftsNoScamOutdatedInElastic,
      nftsScamOutdatedInElastic,
      nftsManualScamInfoMissingInElastic,
      nftsOutdatedOrMissingFromDb,
    ];
  }
}
