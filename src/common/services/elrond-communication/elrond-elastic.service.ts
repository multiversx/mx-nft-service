import { Inject, Injectable } from '@nestjs/common';
import { ApiResponse, Client } from '@elastic/elasticsearch';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { SearchResponse } from './models/elastic-search';
import { ElrondTransactionDTO } from './models/elrond-transaction.dto';

export interface AddressTransactionCount {
  contractAddress: string;
  transactionCount: number;
}
/**
 * Service used for Elrond Elastic endpoint requests;
 */
@Injectable()
export class ElrondElasticService {
  /**
   * Elastic search client
   */
  private client: Client;
  /**
   * Set the correct host to be used
   */
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    this.client = new Client({
      node: process.env.ELROND_ELASTICSEARCH + '/logs',
    });
  }

  async getDelegationTransactionsCount(
    contractAddress: string,
    fromAddress: string,
  ): Promise<number> {
    const targetSeconds = Math.floor(Date.now() / 1000) - 10;
    const body = {
      size: 0,
      query: {
        bool: {
          must: [
            {
              match: {
                sender: fromAddress,
              },
            },
            {
              match: {
                receiver: contractAddress,
              },
            },
            {
              match: {
                status: 'success',
              },
            },
            {
              range: {
                timestamp: {
                  lte: targetSeconds,
                },
              },
            },
          ],
        },
      },
    };
    try {
      const response = await this.client.search({
        body,
      });
      return response.body.hits.total.value;
    } catch (e) {
      this.logger.error('Fail to count transactions', {
        path: 'elrond-elastic.service.getDelegationTransactionsCount',
        address: fromAddress,
        contract: contractAddress,
        exception: e.toString(),
      });
      return 0;
    }
  }

  /**
   * Check if an address had transactions with any of the contracts from the list
   * @param address
   * @param providerAddresses
   * @param offset
   */
  async getDelegationTransactionsCountWithProviders(
    address: string,
    providerAddresses: string[],
    offset = 0,
  ): Promise<string[]> {
    const targetSeconds = Math.floor(Date.now() / 1000) - 10;
    const size = 200;
    const body = {
      from: offset,
      size,
      _source: ['receiver'],
      query: {
        bool: {
          must: [
            {
              match: {
                sender: address,
              },
            },
            {
              match: {
                status: 'success',
              },
            },
            {
              range: {
                timestamp: {
                  lte: targetSeconds,
                },
              },
            },
          ],
          should: providerAddresses.map((receiver) => {
            return {
              match: {
                receiver,
              },
            };
          }),
        },
      },
    };
    try {
      const response: ApiResponse<SearchResponse<ElrondTransactionDTO>> =
        await this.client.search({
          body,
        });
      const responseScAddresses = response.body.hits.hits
        .map((o) => o?._source?.receiver)
        .filter((el) => !!el);
      let newAddresses = [];
      if (response.body.hits.total['value'] > offset + size) {
        newAddresses = await this.getDelegationTransactionsCountWithProviders(
          address,
          providerAddresses,
          offset + size,
        );
      }
      return [...responseScAddresses, ...newAddresses];
    } catch (e) {
      this.logger.error('Fail to count transactions for all providers', {
        path: 'elrond-elastic.service.getDelegationTransactionsCount',
        address,
        exception: e.toString(),
      });
      return [];
    }
  }
}
