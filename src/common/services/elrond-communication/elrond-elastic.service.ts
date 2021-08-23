import { Inject, Injectable } from '@nestjs/common';
import { ApiResponse, Client } from '@elastic/elasticsearch';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { HitResponse, SearchResponse } from './models/elastic-search';

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

  async getNftHistory(collection: string, nonce: string): Promise<any> {
    console.log(collection, nonce);
    const body = {
      size: 10,
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
    try {
      const response: ApiResponse<SearchResponse> = await this.client.search({
        body,
      });

      let responseMap: HitResponse[] = [];
      response.body.hits.hits.forEach((hit) => {
        hit._source.events.forEach((event) => {
          if (event.topics[0] === collection && event.topics[1] === nonce) {
            responseMap.push(hit);
          }
          return;
        });
      });

      return response.body.hits.hits;
    } catch (e) {
      this.logger.error('Fail to count transactions', {
        path: 'elrond-elastic.service.getDelegationTransactionsCount',
        address: nonce,
        exception: e.toString(),
      });
      return 0;
    }
  }
}
