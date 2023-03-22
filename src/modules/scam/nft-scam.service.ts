import { Injectable, Logger } from '@nestjs/common';
import { MxApiService, MxElasticService } from 'src/common';
import { ScamInfo } from '../assets/models/ScamInfo.dto';
import { Asset, ScamInfoTypeEnum } from '../assets/models';
import { NftScamElasticService } from './nft-scam.elastic.service';
import { NftScamRelatedData } from './models/nft-scam-data.model';
import { elasticDictionary } from 'src/config';
import { NftScamInfoModel } from './models/nft-scam-info.model';
import { DocumentDbService } from 'src/document-db/document-db.service';
import { MxApiAbout } from 'src/common/services/mx-communication/models/mx-api-about.model';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import {
  CacheEventTypeEnum,
  ChangedEvent,
} from '../rabbitmq/cache-invalidation/events/changed.event';
import { getCollectionNftsQuery } from './nft-scam.queries';
import { AssetByIdentifierService } from '../assets';
import { Locker } from '@multiversx/sdk-nestjs';
import { PluginService } from 'src/common/pluggins/plugin.service';

@Injectable()
export class NftScamService {
  constructor(
    private documentDbService: DocumentDbService,
    private assetByIdentifierService: AssetByIdentifierService,
    private nftScamElasticService: NftScamElasticService,
    private mxElasticService: MxElasticService,
    private mxApiService: MxApiService,
    private readonly pluginsService: PluginService,
    private readonly cacheEventsPublisher: CacheEventsPublisherService,
    private readonly logger: Logger,
  ) {}

  async validateOrUpdateNftScamInfo(
    identifier: string,
    nftScamRelatedData?: NftScamRelatedData,
    clearManualScamInfo: boolean = false,
  ): Promise<boolean> {
    const nft = await this.assetByIdentifierService.getAsset(identifier);
    await this.pluginsService.computeScamInfo([nft]);

    const [nftFromElastic, nftFromDb, mxApiAbout]: [
      any,
      NftScamInfoModel,
      MxApiAbout,
    ] = await this.getNftsAndMxAbout(nft, nftScamRelatedData);
    const scamEngineVersion = mxApiAbout.scamEngineVersion;

    if (
      nftFromDb?.version === elasticDictionary.scamInfo.manualVersionValue &&
      !clearManualScamInfo
    ) {
      return true;
    }

    if (!nft.scamInfo) {
      await this.validateOrUpdateScamInfoDataForNoScamNft(
        scamEngineVersion,
        nft,
        nftFromElastic,
        nftFromDb,
      );
    } else if (nft.scamInfo) {
      await this.validateOrUpdateScamInfoDataForScamNft(
        scamEngineVersion,
        nft,
        nftFromElastic,
        nftFromDb,
      );
    }

    return true;
  }

  async validateOrUpdateNftsScamInfo(
    nfts: Asset[],
    nftScamRelatedData?: NftScamRelatedData,
    clearManualScamInfo: boolean = false,
  ): Promise<boolean> {
    await this.pluginsService.computeScamInfo(nfts);
    for (const nft of nfts) {
      const [nftFromElastic, nftFromDb, mxApiAbout]: [
        any,
        NftScamInfoModel,
        MxApiAbout,
      ] = await this.getNftsAndMxAbout(nft, nftScamRelatedData);
      const scamEngineVersion = mxApiAbout.scamEngineVersion;

      if (
        nftFromDb?.version === elasticDictionary.scamInfo.manualVersionValue &&
        !clearManualScamInfo
      ) {
        return true;
      }

      if (!nft.scamInfo) {
        await this.validateOrUpdateScamInfoDataForNoScamNft(
          scamEngineVersion,
          nft,
          nftFromElastic,
          nftFromDb,
        );
      } else if (nft.scamInfo) {
        await this.validateOrUpdateScamInfoDataForScamNft(
          scamEngineVersion,
          nft,
          nftFromElastic,
          nftFromDb,
        );
      }

      return true;
    }
  }

  async getNftsAndMxAbout(
    nft: Asset,
    nftScamRelatedData?: NftScamRelatedData,
  ): Promise<[any, NftScamInfoModel, MxApiAbout]> {
    return await Promise.all([
      nftScamRelatedData?.nftFromElastic ??
        this.nftScamElasticService.getNftWithScamInfoFromElastic(
          nft.identifier,
        ),
      nftScamRelatedData?.nftFromDb ??
        this.documentDbService.getNftScamInfo(nft.identifier),
      nftScamRelatedData?.mxApiAbout ?? this.mxApiService.getMxApiAbout(),
    ]);
  }

  async validateOrUpdateAllNftsScamInfo(): Promise<void> {
    await Locker.lock(
      'updateAllNftsScamInfos: Update scam info for all existing NFTs',
      async () => {
        try {
          const mxApiAbout = await this.mxApiService.getMxApiAbout();
          const scamEngineVersion = mxApiAbout.scamEngineVersion;

          const collections =
            await this.nftScamElasticService.getAllCollectionsFromElastic();

          for (let i = 0; i < collections.length; i++) {
            await this.validateOrUpdateAllNftsScamInfoForCollection(
              collections[i],
              scamEngineVersion,
            );
          }

          this.logger.log(
            `Processed NFT Scam Info for ${collections.length} collections`,
            {
              path: `${NftScamService.name}.${this.validateOrUpdateAllNftsScamInfo.name}`,
            },
          );
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

  async validateOrUpdateAllNftsScamInfoForCollection(
    collection: string,
    scamEngineVersion: string,
  ): Promise<void> {
    this.logger.log(`Processing scamInfo for ${collection}...`);
    const nftsQuery = getCollectionNftsQuery(collection);
    await this.mxElasticService.getScrollableList(
      'tokens',
      'identifier',
      nftsQuery,
      async (nftsBatch) => {
        await this.validateOrUpdateNftsScamInfoBatch(
          nftsBatch,
          scamEngineVersion,
        );
      },
    );
  }

  async manuallySetNftScamInfo(
    identifier: string,
    type: ScamInfoTypeEnum,
    info: string,
  ): Promise<boolean> {
    const nft = await this.assetByIdentifierService.getAsset(identifier);
    await Promise.all([
      this.documentDbService.saveOrUpdateNftScamInfo(
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
    this.triggerCacheInvalidation(identifier, nft?.ownerAddress);
    return true;
  }

  async manuallyClearNftScamInfo(identifier: string): Promise<boolean> {
    const nft = await this.assetByIdentifierService.getAsset(identifier);
    await Promise.all([
      this.documentDbService.saveOrUpdateNftScamInfo(
        identifier,
        'manual',
        new ScamInfo({ type: ScamInfoTypeEnum.none }),
      ),
      this.nftScamElasticService.setNftScamInfoManuallyInElastic(
        identifier,
        ScamInfoTypeEnum.none,
      ),
    ]);
    this.triggerCacheInvalidation(identifier, nft?.ownerAddress);
    return true;
  }

  private async triggerCacheInvalidation(
    identifier: string,
    ownerAddress: string,
  ): Promise<void> {
    await this.cacheEventsPublisher.publish(
      new ChangedEvent({
        id: identifier,
        type: CacheEventTypeEnum.ScamUpdate,
        address: ownerAddress,
      }),
    );
  }

  private async validateOrUpdateScamInfoDataForNoScamNft(
    scamEngineVersion: string,
    nftFromApi: Asset,
    nftFromElastic: any,
    nftFromDb: NftScamInfoModel,
  ): Promise<void> {
    const clearScamInfoInElastic =
      nftFromElastic?.[elasticDictionary.scamInfo.typeKey];

    const updateScamInfoInDb =
      !nftFromDb || nftFromDb.type || nftFromDb.version !== scamEngineVersion;

    let updatePromises = [];

    if (updateScamInfoInDb) {
      updatePromises.push(
        this.documentDbService.saveOrUpdateNftScamInfo(
          nftFromApi.identifier,
          scamEngineVersion,
        ),
      );
    }
    if (clearScamInfoInElastic) {
      updatePromises.push(
        this.nftScamElasticService.setBulkNftScamInfoInElastic(
          [nftFromApi],
          true,
        ),
      );
    }

    await Promise.all(updatePromises);
  }

  private async validateOrUpdateScamInfoDataForScamNft(
    scamEngineVersion: string,
    nftFromApi: Asset,
    nftFromElastic: any,
    nftFromDb: NftScamInfoModel,
  ): Promise<void> {
    const isElasticScamInfoDifferent =
      ScamInfo.areApiAndElasticScamInfoDifferent(nftFromApi, nftFromElastic);
    const isDbScamInfoDifferent = ScamInfo.areApiAndDbScamInfoDifferent(
      nftFromApi,
      nftFromDb,
      scamEngineVersion,
    );

    let updatePromises = [];

    if (isDbScamInfoDifferent) {
      updatePromises.push(
        this.documentDbService.saveOrUpdateNftScamInfo(
          nftFromApi.identifier,
          scamEngineVersion,
          new ScamInfo({
            type: ScamInfoTypeEnum[nftFromApi.scamInfo.type],
            info: nftFromApi.scamInfo.info,
          }),
        ),
      );
    }
    if (isElasticScamInfoDifferent) {
      updatePromises.push(
        this.nftScamElasticService.setBulkNftScamInfoInElastic([nftFromApi]),
      );
    }

    await Promise.all(updatePromises);
  }

  private async updateBulkScamInfo(
    scamEngineVersion: string,
    nftFromApi: Asset[],
  ): Promise<void> {
    let updatePromises = [];

    updatePromises.push(
      this.documentDbService.saveOrUpdateBulkNftScamInfo(
        nftFromApi,
        scamEngineVersion,
      ),
    );

    updatePromises.push(
      this.nftScamElasticService.setBulkNftScamInfoInElastic(nftFromApi),
    );

    await Promise.all(updatePromises);
  }

  private async validateOrUpdateNftsScamInfoBatch(
    nftsFromElastic: any,
    scamEngineVersion: string,
  ): Promise<void> {
    if (!nftsFromElastic || nftsFromElastic.length === 0) {
      return;
    }

    const [nftsToMigrateFromDbToElastic, nftsMissingFromDb] =
      await this.getMissingNftsFromDbOrOutdatedInElastic(
        nftsFromElastic,
        scamEngineVersion,
      );

    const apiNfts = await this.mxApiService.getNftsByIdentifiers(
      nftsMissingFromDb?.map((x) => x.identifier),
    );
    const mappedNfts = apiNfts?.map((x) => Asset.fromNft(x));
    await this.pluginsService.computeScamInfo(mappedNfts);

    const elasticUpdates =
      this.nftScamElasticService.buildNftScamInfoDbToElasticMigrationBulkUpdate(
        nftsToMigrateFromDbToElastic,
        nftsFromElastic,
      );

    await Promise.all([
      this.nftScamElasticService.updateBulkNftScamInfoInElastic(elasticUpdates),
      this.updateBulkScamInfo(scamEngineVersion, mappedNfts),
    ]);
  }

  private async getMissingNftsFromDbOrOutdatedInElastic(
    nftsFromElastic: any,
    scamEngineVersion: string,
  ): Promise<[NftScamInfoModel[], NftScamInfoModel[]]> {
    if (!nftsFromElastic || nftsFromElastic.length === 0) {
      return [[], []];
    }
    let nftsToMigrateFromDbToElastic: NftScamInfoModel[] = [];
    let nftsMissingFromDb: NftScamInfoModel[] = [];

    const identifiers = nftsFromElastic.map(
      (nft: { identifier: any }) => nft.identifier,
    );

    const nftsFromDb: NftScamInfoModel[] =
      await this.documentDbService.getBulkNftScamInfo(identifiers);

    for (let i = 0; i < nftsFromElastic?.length; i++) {
      const nftFromElastic = nftsFromElastic[i];
      const nftFromDb = nftsFromDb?.find(
        (nft) => nft.identifier === nftFromElastic.identifier,
      );

      if (!nftFromDb) {
        nftsMissingFromDb.push(nftFromElastic);
        continue;
      }
      if (
        nftFromDb.version !== scamEngineVersion ||
        ScamInfo.areElasticAndDbScamInfoDifferent(nftFromElastic, nftFromDb)
      ) {
        nftsToMigrateFromDbToElastic.push(nftFromDb);
      }
    }

    return [nftsToMigrateFromDbToElastic, nftsMissingFromDb];
  }
}
