import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import {
  HitResponse,
  SearchResponse,
} from '../elrond-communication/models/elastic-search';
import { ApiService } from '../elrond-communication/api.service';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { ElasticQuery } from './entities/elastic.query';

export interface AddressTransactionCount {
  contractAddress: string;
  transactionCount: number;
}

@Injectable()
export class ElrondElasticService {
  private readonly url = process.env.ELROND_ELASTICSEARCH;
  constructor(
    private readonly apiService: ApiService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async getNftHistory(
    collection: string,
    nonce: string,
    size: number,
    timestamp: number | string,
  ): Promise<[HitResponse[], number, number]> {
    const url = `${this.url}/logs/_search`;
    const body = {
      size: 2 * size,
      query: {
        bool: {
          must: [
            {
              range: {
                timestamp: {
                  lt: timestamp,
                },
              },
            },
            {
              nested: {
                path: 'events',
                query: {
                  bool: {
                    must: [
                      {
                        match: {
                          'events.topics': collection,
                        },
                      },
                      {
                        match: {
                          'events.topics': nonce,
                        },
                      },
                    ],
                    must_not: [
                      {
                        match: {
                          'events.identifier': 'bid',
                        },
                      },
                    ],
                  },
                },
              },
            },
          ],
        },
      },
      sort: [
        {
          timestamp: {
            order: 'desc',
          },
        },
      ],
    };
    try {
      const response = await this.apiService.post(url, body);
      const data: SearchResponse = response?.data;
      let responseMap: HitResponse[] = [];
      data?.hits?.hits.forEach((hit) => {
        for (const event of hit._source.events) {
          if (event.topics[0] === collection && event.topics[1] === nonce) {
            responseMap.push(hit);
            break;
          }
        }
      });
      return [
        responseMap,
        data?.hits?.total.value,
        data?.hits?.hits[data?.hits?.hits?.length - 1]?._source.timestamp,
      ];
    } catch (e) {
      this.logger.error('Fail to get logs', {
        path: 'elrond-elastic.service.getNftHistory',
        address: nonce,
        exception: e.toString(),
      });
      return [[], 0, 0];
    }
  }

  async setCustomValue<T>(
    collection: string,
    identifier: string,
    attribute: string,
    value: T,
  ): Promise<void> {
    const url = `${this.url}/${collection}/_update/${identifier}`;

    const profiler = new PerformanceProfiler();
    const fullAttribute = 'nft_' + attribute;

    const payload = {
      doc: {
        [fullAttribute]: value,
      },
    };
    await this.apiService.post(url, payload);

    profiler.stop();
    MetricsCollector.setElasticDuration(collection, profiler.duration);
  }

  async getCustomValue(
    collection: string,
    identifier: string,
    attribute: string,
  ): Promise<any> {
    const url = `${this.url}/${collection}/_search?q=_id:${encodeURIComponent(
      identifier,
    )}`;
    const profiler = new PerformanceProfiler();
    const fullAttribute = 'nft_' + attribute;

    const payload = {
      _source: fullAttribute,
    };

    console.log(url, payload);
    const result = await this.apiService.post(url, payload);

    profiler.stop();
    MetricsCollector.setElasticDuration(collection, profiler.duration);

    const hits = result.data?.hits?.hits;
    if (hits && hits.length > 0) {
      const document = hits[0];

      return document._source[fullAttribute];
    }

    return null;
  }

  async getScrollableList(
    collection: string,
    key: string,
    elasticQuery: ElasticQuery,
    action: (items: any[]) => Promise<void>,
  ): Promise<void> {
    const url = `${this.url}/${collection}/_search?scroll=10m`;

    const profiler = new PerformanceProfiler();

    const result = await this.apiService.post(url, elasticQuery.toJson());

    profiler.stop();

    MetricsCollector.setElasticDuration(collection, profiler.duration);

    const documents = result.data.hits.hits;
    const scrollId = result.data._scroll_id;

    await action(
      documents.map((document: any) => this.formatItem(document, key)),
    );

    while (true) {
      const scrollProfiler = new PerformanceProfiler();

      const scrollResult = await this.apiService.post(
        `${this.url}/_search/scroll`,
        {
          scroll: '20m',
          scroll_id: scrollId,
        },
      );

      scrollProfiler.stop();
      MetricsCollector.setElasticDuration(collection, profiler.duration);

      const scrollDocuments = scrollResult.data.hits.hits;
      if (scrollDocuments.length === 0) {
        break;
      }

      await action(
        scrollDocuments.map((document: any) => this.formatItem(document, key)),
      );
    }
  }

  private formatItem(document: any, key: string) {
    const { _id, _source } = document;
    const item: any = {};
    item[key] = _id;

    return { ...item, ..._source };
  }
}
