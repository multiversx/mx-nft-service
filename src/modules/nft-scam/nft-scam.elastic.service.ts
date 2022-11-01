import { Injectable, Logger } from '@nestjs/common';
import { ElrondElasticService, Nft } from 'src/common';
import { ElasticQuery, QueryOperator, QueryType } from '@elrondnetwork/erdnest';
import { constants } from 'src/config';
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
          'nft_scamInfoVersion',
          'manual',
        ),
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          identifier,
          'nft_scamInfoType',
          type ?? null,
        ),
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          identifier,
          'nft_scamInfoDescription',
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
      } else if (clearScamInfo) {
        updates.push(
          this.elasticService.buildBulkUpdate<string>(
            'tokens',
            nft.identifier,
            'nft_scamInfoType',
            null,
          ),
        );
        updates.push(
          this.elasticService.buildBulkUpdate<string>(
            'tokens',
            nft.identifier,
            'nft_scamInfoDescription',
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
          'nft_scamInfoVersion',
          'manual',
        ),
      );
      updates.push(
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          nft.identifier,
          'nft_scamInfoType',
          nft.type,
        ),
      );
      updates.push(
        this.elasticService.buildBulkUpdate<string>(
          'tokens',
          nft.identifier,
          'nft_scamInfoDescription',
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
        'nft_scamInfoVersion',
        'nft_scamInfoType',
        'nft_scamInfoDescription',
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
        'nft_scamInfoVersion',
        'nft_scamInfoType',
        'nft_scamInfoDescription',
      ])
      .withPagination({
        from: 0,
        size: constants.getCollectionsFromElasticBatchSize,
      });
  }
}
