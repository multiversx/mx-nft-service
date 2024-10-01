import { Injectable, Logger } from '@nestjs/common';
import { MxApiService, MxElasticService } from 'src/common';
import { ScamInfo } from '../assets/models/ScamInfo.dto';
import { Asset, ScamInfoTypeEnum } from '../assets/models';
import { NftScamElasticService } from './nft-scam.elastic.service';
import { NftScamRelatedData } from './models/nft-scam-data.model';
import { elasticDictionary } from 'src/config';
import { NftScamInfoModel } from './models/nft-scam-info.model';
import { DocumentDbService } from 'src/document-db/document-db.service';
import { CacheEventsPublisherService } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { CacheEventTypeEnum, ChangedEvent } from '../rabbitmq/cache-invalidation/events/changed.event';
import { getCollectionNftsQuery } from './nft-scam.queries';
import { AssetByIdentifierService } from '../assets';
import { Locker } from '@multiversx/sdk-nestjs-common';
import { PluginService } from 'src/common/pluggins/plugin.service';
import { ELASTIC_TOKENS_INDEX } from 'src/utils/constants';

@Injectable()
export class NftScamService {
  constructor(
    private readonly documentDbService: DocumentDbService,
    private readonly assetByIdentifierService: AssetByIdentifierService,
    private readonly nftScamElasticService: NftScamElasticService,
    private readonly mxElasticService: MxElasticService,
    private readonly mxApiService: MxApiService,
    private readonly pluginsService: PluginService,
    private readonly cacheEventsPublisher: CacheEventsPublisherService,
    private readonly logger: Logger,
  ) { }

  async validateNftScamInfoForIdentifier(identifier: string): Promise<boolean> {
    const nft = await this.assetByIdentifierService.getAsset(identifier);
    await this.pluginsService.computeScamInfo([nft]);
    await this.validateNftScamInfo(nft);
    return true;
  }

  async validateNftsScamInfoArray(nfts: Asset[]): Promise<boolean> {
    await this.pluginsService.computeScamInfo(nfts);
    for (const nft of nfts) {
      await this.validateNftScamInfo(nft);
    }
    return true;
  }

  async validateOrUpdateAllNftsScamInfo(): Promise<void> {
    await Locker.lock(
      'updateAllNftsScamInfos: Update scam info for all existing NFTs',
      async () => {
        try {
          const mxApiAbout = await this.mxApiService.getMxApiAbout();
          const scamEngineVersion = mxApiAbout.scamEngineVersion;

          const collections = await this.nftScamElasticService.getAllCollectionsFromElastic();

          for (let i = 0; i < collections.length; i++) {
            await this.validateOrUpdateAllNftsScamInfoForCollection(collections[i], scamEngineVersion);
          }

          this.logger.log(`Processed NFT Scam Info for ${collections.length} collections`, {
            path: `${NftScamService.name}.${this.validateOrUpdateAllNftsScamInfo.name}`,
          });
        } catch (error) {
          this.logger.error(`Error when updating/validating scam info for all collections`, {
            path: `${NftScamService.name}.${this.validateOrUpdateAllNftsScamInfo.name}`,
            exception: error?.message,
          });
        }
      },
      true,
    );
  }

  async validateOrUpdateAllNftsScamInfoForCollection(collection: string, scamEngineVersion: string): Promise<void> {
    this.logger.log(`Processing scamInfo for ${collection}...`);
    const nftsQuery = getCollectionNftsQuery(collection);
    await this.mxElasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'identifier', nftsQuery, async (nftsBatch) => {
      await this.validateOrUpdateNftsScamInfoBatch(nftsBatch, scamEngineVersion);
    });
  }

  async markAllNftsForCollection(collection: string, scamEngineVersion: string, scamInfo: ScamInfo): Promise<void> {
    this.logger.log(`Processing scamInfo for ${collection}...`);
    const nftsQuery = getCollectionNftsQuery(collection);
    await this.mxElasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'identifier', nftsQuery, async (nftsBatch) => {
      await this.markNftsScamInfoBatch(nftsBatch, scamEngineVersion, scamInfo);
    });
  }

  async manuallySetNftScamInfo(identifier: string, type: ScamInfoTypeEnum, info: string): Promise<boolean> {
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
        new ScamInfo({
          type: ScamInfoTypeEnum[type],
          info: info,
        }),
      ),
    ]);
    this.triggerCacheInvalidation(identifier, nft?.ownerAddress);
    return true;
  }

  async manuallyClearNftScamInfo(identifier: string): Promise<boolean> {
    const nft = await this.assetByIdentifierService.getAsset(identifier);
    await Promise.all([
      this.documentDbService.saveOrUpdateNftScamInfo(identifier, 'manual', ScamInfo.none()),
      this.nftScamElasticService.setNftScamInfoManuallyInElastic(identifier, ScamInfo.none()),
    ]);
    this.triggerCacheInvalidation(identifier, nft?.ownerAddress);
    return true;
  }

  private async validateNftScamInfo(nft: Asset) {
    const nftScamRelatedInfo = await this.getNftScamInfo(nft);

    if (nftScamRelatedInfo.nftFromDb?.version === elasticDictionary.scamInfo.manualVersionValue) {
      return;
    }

    if (!nft.scamInfo) {
      await this.addScamInfo(nftScamRelatedInfo);
    } else if (nft.scamInfo) {
      await this.updateScamInfo(nftScamRelatedInfo);
    }
    await this.triggerCacheInvalidation(nft?.identifier, nft?.ownerAddress);
  }

  private async getNftScamInfo(nftFromApi: Asset): Promise<NftScamRelatedData> {
    const [nftFromElastic, nftFromDb, mxApiAbout] = await Promise.all([
      this.nftScamElasticService.getNftWithScamInfoFromElastic(nftFromApi.identifier),
      this.documentDbService.getNftScamInfo(nftFromApi.identifier),
      this.mxApiService.getMxApiAbout(),
    ]);

    return new NftScamRelatedData({
      mxApiAbout,
      nftFromElastic,
      nftFromDb,
      nftFromApi,
    });
  }

  private async addScamInfo(nftScamRelatedData: NftScamRelatedData): Promise<void> {
    const clearScamInfoInElastic = nftScamRelatedData.nftFromElastic?.[elasticDictionary.scamInfo.typeKey];

    const updateScamInfoInDb =
      !nftScamRelatedData.nftFromDb ||
      nftScamRelatedData.nftFromDb.type ||
      nftScamRelatedData.nftFromDb.version !== nftScamRelatedData.mxApiAbout.scamEngineVersion;

    let updatePromises = [];

    if (updateScamInfoInDb) {
      updatePromises.push(
        this.documentDbService.saveOrUpdateNftScamInfo(
          nftScamRelatedData.nftFromApi.identifier,
          nftScamRelatedData.mxApiAbout.scamEngineVersion,
        ),
      );
    }
    if (clearScamInfoInElastic) {
      updatePromises.push(this.nftScamElasticService.setBulkNftScamInfoInElastic([nftScamRelatedData.nftFromApi], true));
    }

    await Promise.all(updatePromises);
  }

  private async updateScamInfo(nftScamRelatedData: NftScamRelatedData): Promise<void> {
    let updatePromises = [];

    if (
      ScamInfo.areApiAndDbScamInfoDifferent(
        nftScamRelatedData.nftFromApi,
        nftScamRelatedData.nftFromDb,
        nftScamRelatedData.mxApiAbout.scamEngineVersion,
      )
    ) {
      updatePromises.push(
        this.documentDbService.saveOrUpdateNftScamInfo(
          nftScamRelatedData.nftFromApi.identifier,
          nftScamRelatedData.mxApiAbout.scamEngineVersion,
          new ScamInfo({
            type: ScamInfoTypeEnum[nftScamRelatedData.nftFromApi.scamInfo.type],
            info: nftScamRelatedData.nftFromApi.scamInfo.info,
          }),
        ),
      );
    }
    if (ScamInfo.areApiAndElasticScamInfoDifferent(nftScamRelatedData.nftFromApi, nftScamRelatedData.nftFromElastic)) {
      updatePromises.push(this.nftScamElasticService.setBulkNftScamInfoInElastic([nftScamRelatedData.nftFromApi]));
    }

    await Promise.all(updatePromises);
  }

  private async updateBulkScamInfo(scamEngineVersion: string, nftFromApi: Asset[]): Promise<void> {
    await Promise.all([
      this.documentDbService.saveOrUpdateBulkNftScamInfo(nftFromApi, scamEngineVersion),
      this.nftScamElasticService.setBulkNftScamInfoInElastic(nftFromApi),
    ]);
  }

  private async validateOrUpdateNftsScamInfoBatch(nftsFromElastic: any, scamEngineVersion: string): Promise<void> {
    if (!nftsFromElastic || nftsFromElastic.length === 0) {
      return;
    }

    const [nftsToMigrateFromDbToElastic, nftsMissingFromDb] = await this.getMissingNftsFromDbOrOutdatedInElastic(
      nftsFromElastic,
      scamEngineVersion,
    );

    const apiNfts = await this.mxApiService.getNftsByIdentifiers(nftsMissingFromDb?.map((x) => x.identifier));
    const mappedNfts = apiNfts?.map((x) => Asset.fromNft(x));
    if (!mappedNfts) return;
    await this.pluginsService.computeScamInfo(mappedNfts);

    const elasticUpdates = this.nftScamElasticService.buildNftScamInfoDbToElasticMigrationBulkUpdate(
      nftsToMigrateFromDbToElastic,
      nftsFromElastic,
    );

    await Promise.all([
      this.nftScamElasticService.updateBulkNftScamInfoInElastic(elasticUpdates),
      this.updateBulkScamInfo(scamEngineVersion, mappedNfts),
    ]);
  }

  private async markNftsScamInfoBatch(nftsFromElastic: any, scamEngineVersion: string, scamInfo: ScamInfo): Promise<void> {
    if (!nftsFromElastic || nftsFromElastic.length === 0) {
      return;
    }

    const nftsMissingFromDb = await this.getOutdatedNfts(nftsFromElastic, scamEngineVersion, scamInfo);

    const apiNfts = await this.mxApiService.getNftsByIdentifiers(nftsMissingFromDb?.map((x) => x.identifier));
    if (!apiNfts) return;
    let mappedNfts: Asset[] = apiNfts?.map((x) => new Asset({ ...Asset.fromNft(x), scamInfo }));

    await this.updateBulkScamInfo(scamEngineVersion, mappedNfts);
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

    const identifiers = nftsFromElastic.map((nft: { identifier: any }) => nft.identifier);

    const nftsFromDb: NftScamInfoModel[] = await this.documentDbService.getBulkNftScamInfo(identifiers);

    for (let i = 0; i < nftsFromElastic?.length; i++) {
      const nftFromElastic = nftsFromElastic[i];
      const nftFromDb = nftsFromDb?.find((nft) => nft.identifier === nftFromElastic.identifier);

      if (!nftFromDb) {
        nftsMissingFromDb.push(nftFromElastic);
        continue;
      }
      if (nftFromDb.version !== scamEngineVersion || ScamInfo.areElasticAndDbScamInfoDifferent(nftFromElastic, nftFromDb)) {
        nftsToMigrateFromDbToElastic.push(nftFromDb);
      }
    }

    return [nftsToMigrateFromDbToElastic, nftsMissingFromDb];
  }

  private async getOutdatedNfts(nftsFromElastic: any, scamEngineVersion: string, scamInfo?: ScamInfo): Promise<NftScamInfoModel[]> {
    if (!nftsFromElastic || nftsFromElastic.length === 0) {
      return [];
    }
    let nftsMissingFromDb: NftScamInfoModel[] = [];

    const identifiers = nftsFromElastic.map((nft: { identifier: any }) => nft.identifier);

    const nftsFromDb: NftScamInfoModel[] = await this.documentDbService.getBulkNftScamInfo(identifiers);

    for (let i = 0; i < nftsFromElastic?.length; i++) {
      const nftFromDb = nftsFromDb?.find((nft) => nft.identifier === nftsFromElastic[i].identifier);

      if (!nftFromDb || nftFromDb.version !== scamEngineVersion || nftFromDb.type !== scamInfo?.type) {
        nftsMissingFromDb.push(nftsFromElastic[i]);
      }
    }

    return nftsMissingFromDb;
  }

  private async triggerCacheInvalidation(identifier: string, ownerAddress: string): Promise<void> {
    await this.cacheEventsPublisher.publish(
      new ChangedEvent({
        id: identifier,
        type: CacheEventTypeEnum.ScamUpdate,
        address: ownerAddress,
      }),
    );
  }
}
