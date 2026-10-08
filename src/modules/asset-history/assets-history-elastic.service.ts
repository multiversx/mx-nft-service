import { Injectable } from '@nestjs/common';
import { MxElasticService } from 'src/common';
import { ElasticQuery, ElasticSortOrder, QueryType, RangeLowerThan } from '@multiversx/sdk-nestjs-elastic';
import { constants } from 'src/config';
import { ELASTIC_EVENTS_INDEX } from 'src/utils/constants';

@Injectable()
export class AssetsHistoryElasticService {
  constructor(private readonly mxElasticService: MxElasticService) {}

  async getHistoryLog(collection: string, nonce: string, limit: number, beforeTimestamp: number): Promise<any> {
    const txHashes = new Set<string>();
    const encodedCollection = Buffer.from(collection).toString('hex');
    const encodedNonce = Buffer.from(nonce, 'hex').toString('hex');

    const query = ElasticQuery.create()
      .withMustCondition(QueryType.Match('topics', encodedCollection))
      .withMustCondition(QueryType.Match('topics', encodedNonce))
      .withRangeFilter('timestamp', new RangeLowerThan(beforeTimestamp))
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withPagination({
        from: 0,
        size: constants.getLogsFromElasticBatchSize,
      });

    await this.mxElasticService.getScrollableList(ELASTIC_EVENTS_INDEX, '_id', query, async (events) => {
      for (const event of events) {
        if (event.topics?.[0] === encodedCollection && event.topics?.[1] === encodedNonce) {
          txHashes.add(event.originalTxHash || event.txHash);
        }
      }

      if (txHashes.size >= limit) {
        return false;
      }
    });

    return await this.mxElasticService.getLogsByTxHashes([...txHashes]);
  }
}
