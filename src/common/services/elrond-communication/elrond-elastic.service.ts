import { Inject, Injectable } from '@nestjs/common';
import { ApiResponse, Client } from '@elastic/elasticsearch';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { HitResponse, SearchResponse } from './models/elastic-search';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';

export interface AddressTransactionCount {
  contractAddress: string;
  transactionCount: number;
}

@Injectable()
export class ElrondElasticService {
  private client: Client;
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.client = new Client({
      node: process.env.ELROND_ELASTICSEARCH + '/logs',
    });
  }

  async getNftHistory(
    collection: string,
    nonce: string,
    l: number,
    o: number,
  ): Promise<any> {
    const profiler = new PerformanceProfiler(
      `getNftHistory ${process.env.ELROND_ELASTICSEARCH + '/logs'}`,
    );
    console.log({ collection, nonce });
    const body = {
      size: l,
      from: o,
      query: {
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
      sort: [
        {
          timestamp: {
            order: 'desc',
          },
        },
      ],
    };
    console.log({ body });
    try {
      const response: ApiResponse<SearchResponse> = await this.client.search({
        body,
      });

      profiler.stop();
      MetricsCollector.setExternalCall(
        ElrondElasticService.name,
        'getNftHistory',
        profiler.duration,
      );
      let responseMap: HitResponse[] = [];
      response.body.hits.hits.forEach((hit) => {
        for (const event of hit._source.events) {
          if (event.topics[0] === collection && event.topics[1] === nonce) {
            responseMap.push(hit);
            break;
          }
        }
      });
      return responseMap;
    } catch (e) {
      this.logger.error('Fail to get logs', {
        path: 'elrond-elastic.service.getNftHistory',
        address: nonce,
        exception: e.toString(),
      });
      return 0;
    }
  }
}
