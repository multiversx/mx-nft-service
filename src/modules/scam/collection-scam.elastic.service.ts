import { Injectable, Logger } from '@nestjs/common';
import { MxElasticService } from 'src/common';
import { ElasticQuery, QueryOperator, QueryType } from '@elrondnetwork/erdnest';
import { elasticDictionary } from 'src/config';
import { ScamInfoTypeEnum } from '../assets/models';

@Injectable()
export class CollectionScamElasticService {
  constructor(
    private mxService: MxElasticService,
    private readonly logger: Logger,
  ) {}

  async setNftScamInfoManuallyInElastic(
    collection: string,
    type?: ScamInfoTypeEnum,
    info?: string,
  ): Promise<void> {
    try {
      const updates = [
        this.mxService.buildBulkUpdate<string>(
          'tokens',
          collection,
          elasticDictionary.scamInfo.typeKey,
          type ?? null,
        ),
        this.mxService.buildBulkUpdate<string>(
          'tokens',
          collection,
          elasticDictionary.scamInfo.infoKey,
          info ?? null,
        ),
      ];
      await this.mxService.bulkRequest('tokens', updates);
    } catch (error) {
      this.logger.error(
        'Error when manually setting collection scam info in Elastic',
        {
          path: `${CollectionScamElasticService.name}.${this.setNftScamInfoManuallyInElastic.name}`,
          exception: error?.message,
        },
      );
    }
  }

  async getCollectionWithScamInfoFromElastic(collection: string): Promise<any> {
    let nft: any;
    try {
      const query = this.getCollectionWithScamInfoFromElasticQuery(collection);

      await this.mxService.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (items) => {
          nft = items[0];
          return undefined;
        },
      );
    } catch (error) {
      this.logger.error(
        `Error when getting collection scam info from Elastic`,
        {
          path: `${CollectionScamElasticService.name}.${this.getCollectionWithScamInfoFromElastic.name}`,
          exception: error?.message,
          identifier: collection,
        },
      );
    }
    return nft;
  }

  getCollectionWithScamInfoFromElasticQuery(identifier: string): ElasticQuery {
    return ElasticQuery.create()
      .withMustNotExistCondition('nonce')
      .withMustExistCondition('token')
      .withMustCondition(
        QueryType.Match('identifier', identifier, QueryOperator.AND),
      )
      .withFields([
        'identifier',
        elasticDictionary.scamInfo.typeKey,
        elasticDictionary.scamInfo.infoKey,
      ])
      .withPagination({
        from: 0,
        size: 1,
      });
  }
}
