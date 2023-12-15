import { Injectable } from '@nestjs/common';
import { MxElasticService } from 'src/common';
import { ElasticQuery, ElasticSortOrder, MatchQuery, QueryType, RangeLowerThan } from '@multiversx/sdk-nestjs-elastic';
import { constants } from 'src/config';

@Injectable()
export class AssetsHistoryElasticService {
  constructor(private readonly mxElasticService: MxElasticService) {}

  async getHistoryLog(collection: string, nonce: string, limit: number, beforeTimestamp: number): Promise<any> {
    let elasticLogs = [];
    const encodedCollection = Buffer.from(collection).toString('base64');
    const encodedNonce = Buffer.from(nonce, 'hex').toString('base64');

    const query = ElasticQuery.create()
      .withMustCondition(
        QueryType.Nested('events', [new MatchQuery('events.topics', encodedCollection )]) ,
      )
      .withMustCondition(
        QueryType.Nested('events', [new MatchQuery('events.topics', encodedCollection )]),
      )
      .withRangeFilter('timestamp', new RangeLowerThan(beforeTimestamp))
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withPagination({
        from: 0,
        size: constants.getLogsFromElasticBatchSize,
      });

    await this.mxElasticService.getScrollableList('logs', 'identifier', query, async (logs) => {
      logs.map((log) => {
        const anyMatchingEvent = log.events.find((event) => event.topics?.[0] === encodedCollection && event.topics?.[1] === encodedNonce);
        if (anyMatchingEvent) {
          elasticLogs.push(log);
        }
      });

      if (elasticLogs.length >= limit) {
        return false;
      }
    });

    return [...new Set(elasticLogs)];
  }
}
