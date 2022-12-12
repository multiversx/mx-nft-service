import { Injectable } from '@nestjs/common';
import { ElrondElasticService } from 'src/common';
import {
  ElasticQuery,
  ElasticSortOrder,
  QueryType,
  RangeLowerThan,
} from '@elrondnetwork/erdnest';
import { constants } from 'src/config';

@Injectable()
export class AssetsHistoryElasticService {
  constructor(
    private readonly elrondElasticService: ElrondElasticService, // @Inject(forwardRef(() => AssetsHistoryService)) // private readonly assetsHistoryService: AssetsHistoryService,
  ) {}

  async getHistoryLog(
    collection: string,
    nonce: string,
    limit: number,
    beforeTimestamp: number,
  ): Promise<any> {
    let elasticLogs = [];
    const encodedCollection = Buffer.from(collection).toString('base64');
    const encodedNonce = Buffer.from(nonce, 'hex').toString('base64');

    const query = ElasticQuery.create()
      .withMustCondition(
        QueryType.Nested('events', {
          'events.topics': encodedCollection,
        }),
      )
      .withMustCondition(
        QueryType.Nested('events', {
          'events.topics': encodedNonce,
        }),
      )
      .withRangeFilter('timestamp', new RangeLowerThan(beforeTimestamp))
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withPagination({
        from: 0,
        size: constants.getLogsFromElasticBatchSize,
      });

    await this.elrondElasticService.getScrollableList(
      'logs',
      'identifier',
      query,
      async (logs) => {
        for (let i = 0; i < logs.length; i++) {
          for (let j = 0; j < logs[i].events.length; j++) {
            if (
              logs[i].events[j].topics?.[0] === encodedCollection &&
              logs[i].events[j].topics?.[1] === encodedNonce
            ) {
              elasticLogs.push(logs[i]);
            }
          }
        }

        if (elasticLogs.length >= limit) {
          return false;
        }
      },
    );

    return [...new Set(elasticLogs)];
  }
}
