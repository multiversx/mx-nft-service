import { ElasticQuery, ElasticSortOrder, QueryType } from '@multiversx/sdk-nestjs-elastic';
import { Injectable } from '@nestjs/common';
import { ElasticEventsMapper, MxElasticService } from 'src/common';
import { ELASTIC_EVENTS_INDEX } from 'src/utils/constants';

@Injectable()
export class ElasticAnalyticsService {
  constructor(private readonly elasticService: MxElasticService) {}

  public async getAllEvents(
    startDateUtc: number,
    endDateUtc: number,
    eventNames: string[],
    addresses: string[],
    action: (items: any[]) => Promise<void>,
  ): Promise<void> {
    const gte = new Date(startDateUtc).getTime();
    const lte = new Date(endDateUtc).getTime();

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: 500 })
      .withMustCondition(QueryType.Should(eventNames.map((eventName) => QueryType.Match('identifier', eventName))))
      .withMustCondition(QueryType.Should(addresses.map((address) => QueryType.Match('address', address))))
      .withDateRangeFilter('timestamp', lte, gte)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.ascending }]);
    await this.elasticService.getScrollableList(ELASTIC_EVENTS_INDEX, '_id', elasticQuery, async (events) => {
      await action(ElasticEventsMapper.toLogs(events));
    });
  }

  public async getEventsOrderedByTimestamp(gte: number, lte: number, eventNames: string[]): Promise<any> {
    let eventGroups = [];
    for (const eventName of eventNames) {
      const newGroups = await this.getTransactionsLogs(eventName, gte, lte);
      eventGroups = eventGroups.concat(newGroups);
    }

    eventGroups.sort((a, b) => new Date(a._source?.timestamp).getTime() - new Date(b._source?.timestamp).getTime());

    return eventGroups;
  }

  private async getTransactionsLogs(eventName: string, gte: number, lte: number): Promise<any[]> {
    const elasticQuery = ElasticQuery.create()
      .withMustCondition(QueryType.Match('identifier', eventName))
      .withDateRangeFilter('timestamp', lte, gte)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.ascending }]);

    const events = await this.elasticService.getList(ELASTIC_EVENTS_INDEX, '', elasticQuery);
    return ElasticEventsMapper.toLogs(events);
  }
}
