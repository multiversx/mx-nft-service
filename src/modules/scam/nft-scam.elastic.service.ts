import { Injectable, Logger } from '@nestjs/common';
import { MxElasticService } from 'src/common';
import { elasticDictionary } from 'src/config';
import { Asset } from '../assets/models';
import { ScamInfo } from '../assets/models/ScamInfo.dto';
import { NftScamInfoModel } from './models/nft-scam-info.model';
import { getAllCollectionsFromElasticQuery, getNftWithScamInfoFromElasticQuery } from './nft-scam.queries';
import { ELASTIC_TOKENS_INDEX } from 'src/utils/constants';

@Injectable()
export class NftScamElasticService {
  constructor(private mxService: MxElasticService, private readonly logger: Logger) {}

  async getNftWithScamInfoFromElastic(identifier: string): Promise<any> {
    let nft: any;
    try {
      const query = getNftWithScamInfoFromElasticQuery(identifier);

      await this.mxService.getScrollableList(ELASTIC_TOKENS_INDEX, 'identifier', query, async (items) => {
        nft = items[0];
        return undefined;
      });
    } catch (error) {
      this.logger.error(`Error when getting NFT scamInfo values from Elastic`, {
        path: `${NftScamElasticService.name}.${this.getNftWithScamInfoFromElastic.name}`,
        exception: error?.message,
        identifier: identifier,
      });
    }
    return nft;
  }

  async setBulkNftScamInfoInElastic(nfts: Asset[], clearScamInfoIfEmpty?: boolean): Promise<void> {
    if (nfts.length > 0) {
      try {
        await this.mxService.bulkRequest(ELASTIC_TOKENS_INDEX, this.buildNftScamInfoBulkUpdate(nfts, clearScamInfoIfEmpty));
      } catch (error) {
        this.logger.error('Error when bulk updating nft scam info in Elastic', {
          path: `${NftScamElasticService.name}.${this.setBulkNftScamInfoInElastic.name}`,
          exception: error?.message,
        });
      }
    }
  }

  async updateBulkNftScamInfoInElastic(updates: string[]): Promise<void> {
    if (updates.length > 0) {
      try {
        await this.mxService.bulkRequest(ELASTIC_TOKENS_INDEX, updates, '?timeout=1m');
      } catch (error) {
        this.logger.error('Error when bulk updating nft scam info in Elastic', {
          path: `${NftScamElasticService.name}.${this.updateBulkNftScamInfoInElastic.name}`,
          exception: error?.message,
        });
      }
    }
  }

  async setNftScamInfoManuallyInElastic(identifier: string, scamInfo: ScamInfo): Promise<void> {
    try {
      const updates = [
        this.mxService.buildBulkUpdate<string>(
          ELASTIC_TOKENS_INDEX,
          identifier,
          elasticDictionary.scamInfo.typeKey,
          scamInfo?.type ?? null,
        ),
        this.mxService.buildBulkUpdate<string>(
          ELASTIC_TOKENS_INDEX,
          identifier,
          elasticDictionary.scamInfo.infoKey,
          scamInfo?.info ?? null,
        ),
      ];
      await this.mxService.bulkRequest(ELASTIC_TOKENS_INDEX, updates);
    } catch (error) {
      this.logger.error('Error when manually setting nft scam info in Elastic', {
        path: `${NftScamElasticService.name}.${this.setNftScamInfoManuallyInElastic.name}`,
        exception: error?.message,
      });
    }
  }

  async setCollectionScamInfoManuallyInElastic(collection: string, scamInfo: ScamInfo): Promise<void> {
    try {
      const updates = [
        this.mxService.buildBulkUpdate<string>(
          ELASTIC_TOKENS_INDEX,
          collection,
          elasticDictionary.scamInfo.typeKey,
          scamInfo?.type ?? null,
        ),
        this.mxService.buildBulkUpdate<string>(
          ELASTIC_TOKENS_INDEX,
          collection,
          elasticDictionary.scamInfo.infoKey,
          scamInfo?.info ?? null,
        ),
      ];
      await this.mxService.bulkRequest(ELASTIC_TOKENS_INDEX, updates);
    } catch (error) {
      this.logger.error('Error when manually setting collection scam info in Elastic', {
        path: `${NftScamElasticService.name}.${this.setCollectionScamInfoManuallyInElastic.name}`,
        exception: error?.message,
      });
    }
  }

  async getAllCollectionsFromElastic(): Promise<string[]> {
    const query = getAllCollectionsFromElasticQuery();
    let collections: string[] = [];
    await this.mxService.getScrollableList(ELASTIC_TOKENS_INDEX, 'token', query, async (items) => {
      collections = collections.concat([...new Set(items.map((i) => i.token))]);
    });
    return collections;
  }

  buildNftScamInfoBulkUpdate(nfts: Asset[], clearScamInfo?: boolean): string[] {
    let updates: string[] = [];
    for (const nft of nfts) {
      if (nft.scamInfo) {
        updates.push(
          this.mxService.buildBulkUpdate<string>(
            ELASTIC_TOKENS_INDEX,
            nft.identifier,
            elasticDictionary.scamInfo.typeKey,
            nft.scamInfo.type,
          ),
        );
        updates.push(
          this.mxService.buildBulkUpdate<string>(
            ELASTIC_TOKENS_INDEX,
            nft.identifier,
            elasticDictionary.scamInfo.infoKey,
            nft.scamInfo.info,
          ),
        );
      } else if (clearScamInfo) {
        updates.push(
          this.mxService.buildBulkUpdate<string>(ELASTIC_TOKENS_INDEX, nft.identifier, elasticDictionary.scamInfo.typeKey, null),
        );
        updates.push(
          this.mxService.buildBulkUpdate<string>(ELASTIC_TOKENS_INDEX, nft.identifier, elasticDictionary.scamInfo.infoKey, null),
        );
      }
    }
    return updates;
  }

  buildNftScamInfoDbToElasticMigrationBulkUpdate(nftsFromDb: NftScamInfoModel[], nftsFromElastic: any): string[] {
    let updates: string[] = [];
    for (let i = 0; i < nftsFromDb.length; i++) {
      const nftFromElastic = nftsFromElastic.find((nft) => nft.identifier === nftsFromDb[i].identifier);
      if (!nftsFromDb[i] && nftFromElastic?.[elasticDictionary.scamInfo.typeKey]) {
        updates.push(
          this.mxService.buildBulkUpdate<string>(ELASTIC_TOKENS_INDEX, nftsFromDb[i].identifier, elasticDictionary.scamInfo.typeKey, null),
        );
        updates.push(
          this.mxService.buildBulkUpdate<string>(ELASTIC_TOKENS_INDEX, nftsFromDb[i].identifier, elasticDictionary.scamInfo.infoKey, null),
        );
      } else {
        updates.push(
          this.mxService.buildBulkUpdate<string>(
            ELASTIC_TOKENS_INDEX,
            nftsFromDb[i].identifier,
            elasticDictionary.scamInfo.typeKey,
            nftsFromDb[i].type,
          ),
        );
        updates.push(
          this.mxService.buildBulkUpdate<string>(
            ELASTIC_TOKENS_INDEX,
            nftsFromDb[i].identifier,
            elasticDictionary.scamInfo.infoKey,
            nftsFromDb[i].info,
          ),
        );
      }
    }
    return updates;
  }
}
