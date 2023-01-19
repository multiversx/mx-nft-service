import {
  ElasticQuery,
  ElasticSortOrder,
  QueryType,
} from '@elrondnetwork/erdnest';
import { Injectable } from '@nestjs/common';
import { MxElasticService } from 'src/common';

@Injectable()
export class ElasticAnalyticsService {
  constructor(private readonly elasticService: MxElasticService) {}

  public async getAllEvents(
    startDateUtc: string,
    endDateUtc: string,
    eventNames: string[],
    addresses: string[],
    action: (items: any[]) => Promise<void>,
  ): Promise<void> {
    const gte = new Date(startDateUtc).getTime() / 1000;
    const lte = new Date(endDateUtc).getTime() / 1000;

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: 500 })
      .withMustCondition(
        QueryType.Should(
          eventNames.map((eventName) =>
            QueryType.Nested('events', {
              'events.identifier': eventName,
            }),
          ),
        ),
      )
      .withMustCondition(
        QueryType.Should(
          addresses.map((address) =>
            QueryType.Nested('events', {
              'events.address': address,
            }),
          ),
        ),
      )
      .withDateRangeFilter('timestamp', lte, gte)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.ascending }]);

    await this.elasticService.getScrollableList(
      'logs',
      '_id',
      elasticQuery,
      action,
    );
  }

  public async getEventsOrderedByTimestamp(
    gte: number,
    lte: number,
    eventNames: string[],
  ): Promise<any> {
    let eventGroups = [];
    for (const eventName of eventNames) {
      const newGroups = await this.getTransactionsLogs(eventName, gte, lte);
      eventGroups = eventGroups.concat(newGroups);
    }

    eventGroups.sort(
      (a, b) =>
        new Date(a._source.timestamp).getTime() -
        new Date(b._source.timestamp).getTime(),
    );

    return eventGroups;
  }

  private async getTransactionsLogs(
    eventName: string,
    gte: number,
    lte: number,
  ): Promise<any[]> {
    const elasticQuery = ElasticQuery.create()
      .withMustCondition(
        QueryType.Should(
          [eventName].map((eventName) =>
            QueryType.Nested('events', {
              'events.identifier': eventName,
            }),
          ),
        ),
      )
      .withDateRangeFilter('timestamp', lte, gte)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.ascending }]);

    return await this.elasticService.getList('logs', '', elasticQuery);
  }
}
