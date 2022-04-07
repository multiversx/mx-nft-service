import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { HitResponse, SearchResponse } from './models/elastic-search';
import { ApiService } from '../api.service';

export interface AddressTransactionCount {
  contractAddress: string;
  transactionCount: number;
}

@Injectable()
export class ElrondElasticService {
  private readonly url = process.env.ELROND_ELASTICSEARCH + '/logs';
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
    const url = `${this.url}/_search`;
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
}
