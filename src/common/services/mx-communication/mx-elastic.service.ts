import { Injectable, Logger } from '@nestjs/common';
import { HitResponse, SearchResponse } from './models/elastic-search';
import { ApiService } from './api.service';
import { PerformanceProfiler } from 'src/modules/metrics/performance.profiler';
import { MetricsCollector } from 'src/modules/metrics/metrics.collector';
import { ElasticQuery, QueryType } from '@multiversx/sdk-nestjs-elastic';
import { ElasticMetricType } from '@multiversx/sdk-nestjs-monitoring';
import { ApiSettings } from './models/api-settings';
import { constants } from 'src/config';
import { HoldersCount } from 'src/modules/analytics/models/general-stats.model';
import { NftTypeEnum } from 'src/modules/assets/models';
export interface AddressTransactionCount {
  contractAddress: string;
  transactionCount: number;
}

@Injectable()
export class MxElasticService {
  private readonly url = process.env.ELROND_ELASTICSEARCH;
  constructor(private readonly apiService: ApiService, private readonly logger: Logger) {}

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
      return [responseMap, data?.hits?.total.value, data?.hits?.hits[data?.hits?.hits?.length - 1]?._source.timestamp];
    } catch (e) {
      this.logger.error('Fail to get logs', {
        path: `${MxElasticService.name}.${this.getNftHistory.name}`,
        address: nonce,
        exception: e.toString(),
      });
      return [[], 0, 0];
    }
  }

  async setCustomValue<T>(collection: string, identifier: string, body: any, urlParams: string = null): Promise<void> {
    const uris: string[] = process.env.ELROND_ELASTICSEARCH_UPDATE.split(',');

    const profiler = new PerformanceProfiler();
    const promises = uris.map((uri) => this.apiService.post(`${uri}/${collection}/_update/${identifier}${urlParams}`, body));
    await Promise.all(promises);

    profiler.stop();
    MetricsCollector.setElasticDuration(collection, profiler.duration);
  }

  async bulkRequest<T>(collection: string, updates: string[], urlParams: string = ''): Promise<void> {
    const batchSize = constants.bulkUpdateElasticBatchSize;
    const uris: string[] = process.env.ELROND_ELASTICSEARCH_UPDATE.split(',');

    const profiler = new PerformanceProfiler();

    try {
      for (let i = 0; i < updates.length; i += batchSize) {
        const body = this.buildBulkUpdateBody(updates.slice(i, i + batchSize));

        const promises = uris.map((url) =>
          this.apiService.post(
            `${url}/${collection}/_bulk${urlParams}`,
            body,
            new ApiSettings({
              contentType: 'application/x-ndjson',
            }),
          ),
        );

        await Promise.all(promises);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (error) {
      this.logger.error({
        method: 'POST',
        resourceUrl: `${collection}/_bulk${urlParams}`,
        response: error.response?.data,
        status: error.response?.status,
        message: error.message,
        name: error.name,
      });
    }

    profiler.stop();
    MetricsCollector.setElasticDuration(collection, profiler.duration);
  }

  async putMappings(collection: string, body: string, urlParams: string = ''): Promise<any> {
    const profiler = new PerformanceProfiler();
    try {
      const uris: string[] = process.env.ELROND_ELASTICSEARCH_UPDATE.split(',');

      const promises = uris.map((uri) =>
        this.apiService.post(
          `${uri}/${collection}/_mapping${urlParams}`,
          body,
          new ApiSettings({
            contentType: 'application/x-ndjson',
          }),
        ),
      );
      await Promise.all(promises);
    } catch (error) {
      this.logger.error({
        method: 'POST',
        resourceUrl: `${collection}/_mapping${urlParams}`,
        response: error.response?.data,
        status: error.response?.status,
        message: error.message,
        name: error.name,
      });
      throw error;
    } finally {
      profiler.stop();
      MetricsCollector.setElasticDuration(collection, profiler.duration);
    }
  }

  async getCustomValue(collection: string, identifier: string, attribute: string): Promise<any> {
    const url = `${this.url}/${collection}/_search?q=_id:${encodeURIComponent(identifier)}`;
    const profiler = new PerformanceProfiler();
    const fullAttribute = 'nft_' + attribute;

    const payload = {
      _source: fullAttribute,
    };

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
    action: (items: any[]) => Promise<boolean | any>,
    maxItems: number = null,
  ): Promise<void> {
    const url = `${this.url}/${collection}/_search?scroll=10m`;

    const profiler = new PerformanceProfiler();

    const result = await this.apiService.post(url, elasticQuery.toJson());

    profiler.stop();

    MetricsCollector.setElasticDuration(collection, profiler.duration);

    const documents = result.data.hits.hits;
    const scrollId = result.data._scroll_id;
    let totalResults: number = 0;

    let actionResult = await action(documents.map((document: any) => this.formatItem(document, key)));

    while (true && actionResult !== false) {
      const scrollProfiler = new PerformanceProfiler();

      let scrollResult: any = null;

      let tries = 3;
      while (tries > 0) {
        try {
          scrollResult = await this.apiService.post(`${this.url}/_search/scroll`, {
            scroll: '20m',
            scroll_id: scrollId,
          });
          break;
        } catch (error) {
          tries--;
          if (tries === 0) throw error;
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }

      scrollProfiler.stop();
      MetricsCollector.setElasticDuration(collection, profiler.duration);

      const scrollDocuments = scrollResult.data.hits.hits;
      if (scrollDocuments.length === 0) {
        break;
      }

      totalResults += scrollDocuments.length;
      if (maxItems && totalResults >= maxItems) {
        break;
      }

      actionResult = await action(scrollDocuments.map((document: any) => this.formatItem(document, key)));
    }

    await this.clearScrollableList(scrollId);
  }

  async clearScrollableList(scrollId: string): Promise<void> {
    await this.apiService.delete(
      `${this.url}/_search/scroll`,
      {},
      {
        scroll_id: scrollId,
      },
    );
  }

  async getHoldersCount(): Promise<number> {
    const query = ElasticQuery.create()
      .withPagination({ from: 0, size: 0 })
      .withShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT].map((type) => QueryType.Match('type', type)))
      .withExtra({
        aggs: {
          unique_addresses: {
            cardinality: {
              field: 'address',
            },
          },
        },
      })
      .toJson();

    const resultRaw = await this.apiService.post(`${this.url}/accountsesdt/_search`, query, {
      timeout: 120000,
    });
    const result = resultRaw?.data?.aggregations?.unique_addresses?.value;
    return result as number;
  }

  async getHoldersCountForCollection(collectionIdentifier: string): Promise<number> {
    const query = ElasticQuery.create()
      .withPagination({ from: 0, size: 0 })
      .withShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT].map((type) => QueryType.Match('type', type)))
      .withMustCondition(QueryType.Match('token', collectionIdentifier))
      .withExtra({
        aggs: {
          unique_addresses: {
            cardinality: {
              field: 'address',
            },
          },
        },
      })
      .toJson();

    const resultRaw = await this.apiService.post(`${this.url}/accountsesdt/_search`, query, {
      timeout: 120000,
    });
    const result = resultRaw?.data?.aggregations?.unique_addresses?.value;
    return result as number;
  }

  async getTopHoldersCountForCollections(): Promise<HoldersCount[]> {
    const query = ElasticQuery.create()
      .withPagination({ from: 0, size: 0 })
      .withShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT].map((type) => QueryType.Match('type', type)))
      .withExtra({
        aggs: {
          first_by_address: {
            terms: {
              field: 'address',
            },
          },
        },
      })
      .toJson();

    const resultRaw = await this.apiService.post(`${this.url}/accountsesdt/_search`, query, {
      timeout: 120000,
    });
    const result = resultRaw?.data?.aggregations?.first_by_address?.buckets.map(
      (x: { doc_count: any; key: any }) =>
        new HoldersCount({
          count: x.doc_count,
          address: x.key,
        }),
    );
    return result;
  }

  async getTopHoldersCountForCollection(collectionIdentifier: string): Promise<HoldersCount[]> {
    const query = ElasticQuery.create()
      .withPagination({ from: 0, size: 0 })
      .withShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT].map((type) => QueryType.Match('type', type)))
      .withMustCondition(QueryType.Match('token', collectionIdentifier))
      .withExtra({
        aggs: {
          first_by_address: {
            terms: {
              field: 'address',
            },
          },
        },
      })
      .toJson();

    const resultRaw = await this.apiService.post(`${this.url}/accountsesdt/_search`, query, {
      timeout: 120000,
    });
    const result = resultRaw?.data?.aggregations?.first_by_address?.buckets.map(
      (x: { doc_count: any; key: any }) =>
        new HoldersCount({
          count: x.doc_count,
          address: x.key,
        }),
    );
    return result;
  }

  buildUpdateBody<T>(fieldName: string, fieldValue: T): any {
    return {
      doc: {
        [fieldName]: fieldValue,
      },
    };
  }

  buildBulkUpdate<T>(collection: string, identifier: string, fieldName: string, fieldValue: T): string {
    return (
      JSON.stringify({
        update: {
          _id: identifier,
          _index: collection,
        },
      }) +
      '\n' +
      JSON.stringify({
        doc: {
          [fieldName]: fieldValue,
        },
      }) +
      '\n'
    );
  }

  buildPutMappingBody<T>(fieldName: string, filedType: string): string {
    return JSON.stringify({
      properties: {
        [fieldName]: {
          type: filedType,
        },
      },
    });
  }

  buildPutMultipleMappingsBody<T>(mappings: { key: string; value: any }[]): string {
    let properties = {};
    for (const mapping of mappings) {
      properties[mapping.key] = {
        type: mapping.value,
      };
    }
    return JSON.stringify({
      properties: properties,
    });
  }

  async getList(collection: string, key: string, elasticQuery: ElasticQuery): Promise<any[]> {
    const url = `${this.url}/${collection}/_search`;

    const profiler = new PerformanceProfiler();
    const result = await this.apiService.post(url, elasticQuery.toJson());

    profiler.stop();

    MetricsCollector.setElasticDuration(ElasticMetricType.list, profiler.duration);

    const documents = result.data.hits.hits;
    return documents.map((document: any) => this.formatItem(document, key));
  }

  private buildBulkUpdateBody(updates: string[]): string {
    let body = '';
    for (let i = 0; i < updates.length; i++) {
      body += updates[i];
    }
    return body;
  }

  private formatItem(document: any, key: string) {
    const { _id, _source } = document;
    const item: any = {};
    item[key] = _id;

    return { ...item, ..._source };
  }
}
