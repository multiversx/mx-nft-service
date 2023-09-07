import { QueryRequest } from '../common/filters/QueryRequest';
import { Filter, FiltersExpression, GroupBy, Grouping, Operation, Operator } from '../common/filters/filtersTypes';
import { DateUtils } from 'src/utils/date-utils';

export const auctionsByNoBidsRequest = (startDateTimestamp: string): QueryRequest =>
  new QueryRequest({
    customFilters: [],
    offset: 0,
    limit: 1000,
    filters: new FiltersExpression({
      filters: [
        new Filter({
          field: 'status',
          values: ['Running'],
          op: Operation.EQ,
        }),
        new Filter({
          field: 'tags',
          values: [null],
          op: Operation.LIKE,
        }),
        new Filter({
          field: 'startDate',
          values: [startDateTimestamp],
          op: Operation.LE,
        }),
      ],
      operator: Operator.AND,
    }),
    groupByOption: new Grouping({
      groupBy: GroupBy.IDENTIFIER,
    }),
    sorting: [],
  });

export function getAuctionsForCollectionRequest(collection: string, startDate: string) {
  return new QueryRequest({
    customFilters: [],
    offset: 0,
    limit: 10000,
    filters: new FiltersExpression({
      filters: [
        new Filter({
          field: 'status',
          values: ['Running'],
          op: Operation.EQ,
        }),
        new Filter({
          field: 'tags',
          values: [null],
          op: Operation.LIKE,
        }),
        new Filter({
          field: 'startDate',
          values: [startDate],
          op: Operation.LE,
        }),
        new Filter({
          field: 'collection',
          values: [collection],
          op: Operation.EQ,
        }),
      ],
      operator: Operator.AND,
    }),
    groupByOption: new Grouping({
      groupBy: GroupBy.IDENTIFIER,
    }),
    sorting: [],
  });
}

export function getAuctionsForPaymentTokenRequest(paymentToken: string, startDate: string) {
  return new QueryRequest({
    customFilters: [],
    offset: 0,
    limit: 10000,
    filters: new FiltersExpression({
      filters: [
        new Filter({
          field: 'status',
          values: ['Running'],
          op: Operation.EQ,
        }),
        new Filter({
          field: 'tags',
          values: [null],
          op: Operation.LIKE,
        }),
        new Filter({
          field: 'startDate',
          values: [startDate],
          op: Operation.LE,
        }),
        new Filter({
          field: 'paymentToken',
          values: [paymentToken],
          op: Operation.EQ,
        }),
      ],
      operator: Operator.AND,
    }),
    groupByOption: new Grouping({
      groupBy: GroupBy.IDENTIFIER,
    }),
    sorting: [],
  });
}

export const runningAuctionRequest = (startDateTimestamp: string): QueryRequest =>
  new QueryRequest({
    customFilters: [],
    offset: 0,
    limit: 10000,
    filters: new FiltersExpression({
      filters: [
        new Filter({
          field: 'status',
          values: ['Running'],
          op: Operation.EQ,
        }),
        new Filter({
          field: 'startDate',
          values: [startDateTimestamp],
          op: Operation.LE,
        }),
      ],
      operator: Operator.AND,
    }),
    groupByOption: new Grouping({
      groupBy: GroupBy.IDENTIFIER,
    }),
    sorting: [],
  });

export const buyNowAuctionRequest = (startDateTimestamp: string): QueryRequest =>
  new QueryRequest({
    customFilters: [],
    offset: 0,
    limit: 10000,
    filters: new FiltersExpression({
      filters: [
        new Filter({
          field: 'status',
          values: ['Running'],
          op: Operation.EQ,
        }),
        new Filter({
          field: 'maxBid',
          values: ['0.01'],
          op: Operation.GE,
        }),
        new Filter({
          field: 'startDate',
          values: [startDateTimestamp],
          op: Operation.LE,
        }),
      ],
      operator: Operator.AND,
    }),
    groupByOption: new Grouping({
      groupBy: GroupBy.IDENTIFIER,
    }),
    sorting: [],
  });
