import {
  ElasticQuery,
  QueryType,
  RangeLowerThan,
  RangeGreaterThan,
  ElasticSortOrder,
  QueryConditionOptions,
  MatchQuery,
} from '@multiversx/sdk-nestjs-elastic';
import { constants } from 'src/config';
import { MarketplaceEventsIndexingRequest } from './models/MarketplaceEventsIndexingRequest';

export const getMarketplaceTransactionsElasticQuery = (input: MarketplaceEventsIndexingRequest): ElasticQuery => {
  return ElasticQuery.create()
    .withCondition(
      QueryConditionOptions.should,
      QueryType.Must([
        QueryType.Should([
          QueryType.Match('sender', input.marketplaceAddress),
          QueryType.Match('receiver', input.marketplaceAddress),
          QueryType.Match('receivers', input.marketplaceAddress),
        ]),
      ]),
    )
    .withRangeFilter('timestamp', new RangeLowerThan(input.txTimestampDelimiter))
    .withRangeFilter('timestamp', new RangeLowerThan(input.beforeTimestamp))
    .withRangeFilter('timestamp', new RangeGreaterThan(input.afterTimestamp))
    .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
    .withFields(['sender', 'receiver', 'data', 'value', 'timestamp', 'miniBlockHash'])
    .withPagination({
      from: 0,
      size: constants.getLogsFromElasticBatchSize,
    });
};

export const getMarketplaceEventsElasticQuery = (input: MarketplaceEventsIndexingRequest): ElasticQuery => {
  return ElasticQuery.create()
    .withMustCondition(QueryType.Nested('events', [new MatchQuery('events.address', input.marketplaceAddress)]))
    .withRangeFilter('timestamp', new RangeLowerThan(input.beforeTimestamp))
    .withRangeFilter('timestamp', new RangeGreaterThan(input.afterTimestamp))
    .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
    .withPagination({
      from: 0,
      size: constants.getLogsFromElasticBatchSize,
    });
};
