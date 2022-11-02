import { Injectable, Logger } from '@nestjs/common';
import { ElrondElasticService, Nft } from 'src/common';
import { ElasticQuery, QueryOperator, QueryType } from '@elrondnetwork/erdnest';
import { constants, elasticDict } from 'src/config';
import { NftTypeEnum, ScamInfoTypeEnum } from '../assets/models';
import { NftScamEntity } from 'src/db/reports-nft-scam';

@Injectable()
export class NftScamElasticService {
  constructor(
    private elasticService: ElrondElasticService,
    private readonly logger: Logger,
  ) {}

  async getNftWithScamInfoFromElastic(identifier: string): Promise<any> {
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
        path: `${NftScamElasticService.name}.${this.getNftWithScamInfoFromElastic.name}`,
        exception: error?.message,
        identifier: identifier,
      });
    }
    return nft;
  }

  async setBulkNftScamInfoInElastic(
    nfts: Nft[],
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
          path: `${NftScamElasticService.name}.${this.setBulkNftScamInfoInElastic.name}`,
          exception: error?.message,
        });
      }
    }
  }

  async updateBulkNftScamInfoInElastic(updates: string[]): Promise<void> {
    if (updates.length > 0) {
      try {
        await this.elasticService.bulkRequest('tokens', updates, '?timeout=1m');
      } catch (error) {
        this.logger.error('Error when bulk updating nft scam info in Elastic', {
          path: `${NftScamElasticService.name}.${this.updateBulkNftScamInfoInElastic.name}`,
          exception: error?.message,
        });
      }
    }
  }

  async setNftScamInfoManuallyInElastic(
    identifier: string,
    type?: ScamInfoTypeEnum,
    info?: string,
  ): Promise<void> {
    try {
      const updates = [
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          identifier,
          elasticDict.scamInfo.versionKey,
          elasticDict.scamInfo.manualVersionValue,
        ),
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          identifier,
          elasticDict.scamInfo.typeKey,
          type ?? null,
        ),
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          identifier,
          elasticDict.scamInfo.infoKey,
          info ?? null,
        ),
      ];
      await this.elasticService.bulkRequest('tokens', updates);
    } catch (error) {
      this.logger.error(
        'Error when manually setting nft scam info in Elastic',
        {
          path: `${NftScamElasticService.name}.${this.setNftScamInfoManuallyInElastic.name}`,
          exception: error?.message,
        },
      );
    }
  }

  getAllNftsWithScamInfoFromElasticQuery(): ElasticQuery {
    let query = ElasticQuery.create()
      .withMustExistCondition('nonce')
      .withFields([
        elasticDict.scamInfo.versionKey,
        elasticDict.scamInfo.typeKey,
        elasticDict.scamInfo.infoKey,
      ])
      .withPagination({
        from: 0,
        size: constants.getNftsFromElasticBatchSize,
      });
    return query;
  }

  buildNftScamInfoBulkUpdate(
    nfts: Nft[],
    version: string,
    clearScamInfo?: boolean,
  ): string[] {
    let updates: string[] = [];
    for (const nft of nfts) {
      updates.push(
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          nft.identifier,
          elasticDict.scamInfo.versionKey,
          version,
        ),
      );
      if (nft.scamInfo) {
        updates.push(
          this.elasticService.buildBulkUpdate<string>(
            'tokens',
            nft.identifier,
            elasticDict.scamInfo.typeKey,
            nft.scamInfo.type,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<string>(
            'tokens',
            nft.identifier,
            elasticDict.scamInfo.infoKey,
            nft.scamInfo.info,
          ),
        );
      } else if (clearScamInfo) {
        updates.push(
          this.elasticService.buildBulkUpdate<string>(
            'tokens',
            nft.identifier,
            elasticDict.scamInfo.typeKey,
            null,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<string>(
            'tokens',
            nft.identifier,
            elasticDict.scamInfo.infoKey,
            null,
          ),
        );
      }
    }
    return updates;
  }

  buildNftScamInfoDbToElasticBulkUpdate(nfts: NftScamEntity[]): string[] {
    let updates: string[] = [];
    for (const nft of nfts) {
      updates.push(
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          nft.identifier,
          elasticDict.scamInfo.versionKey,
          'manual',
        ),
      );
      updates.push(
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          nft.identifier,
          elasticDict.scamInfo.typeKey,
          nft.type,
        ),
      );
      updates.push(
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          nft.identifier,
          elasticDict.scamInfo.infoKey,
          nft.info,
        ),
      );
    }
    return updates;
  }

  getNftWithScamInfoFromElasticQuery(identifier: string): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('nonce')
      .withMustCondition(
        QueryType.Match('identifier', identifier, QueryOperator.AND),
      )
      .withFields([
        elasticDict.scamInfo.versionKey,
        elasticDict.scamInfo.typeKey,
        elasticDict.scamInfo.infoKey,
      ])
      .withPagination({
        from: 0,
        size: 1,
      });
  }

  getAllCollectionsFromElasticQuery(): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('token')
      .withMustNotExistCondition('nonce')
      .withMustMultiShouldCondition(
        [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
        (type) => QueryType.Match('type', type),
      )
      .withFields(['token'])
      .withPagination({
        from: 0,
        size: constants.getCollectionsFromElasticBatchSize,
      });
  }

  getAllCollectionNftsFromElasticQuery(collection: string): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('nonce')
      .withMustCondition(
        QueryType.Match('token', collection, QueryOperator.AND),
      )
      .withMustMultiShouldCondition(
        [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
        (type) => QueryType.Match('type', type),
      )
      .withFields([
        elasticDict.scamInfo.versionKey,
        elasticDict.scamInfo.typeKey,
        elasticDict.scamInfo.infoKey,
      ])
      .withPagination({
        from: 0,
        size: constants.getCollectionsFromElasticBatchSize,
      });
  }
}
