import { QueryRequest } from '../common/filters/QueryRequest';
import {
  Filter,
  FiltersExpression,
  GroupBy,
  Grouping,
  Operation,
  Operator,
} from '../common/filters/filtersTypes';
import { DateUtils } from 'src/utils/date-utils';

export const auctionsByNoBidsRequest = new QueryRequest({
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
        values: [DateUtils.getCurrentTimestamp().toString()],
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

export function getAuctionsForCollectionRequest(collection: string) {
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
          values: [Math.round(new Date().getTime() / 1000).toString()],
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

export const runningAuctionRequest = new QueryRequest({
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
        values: [Math.round(new Date().getTime() / 1000).toString()],
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

export const buyNowAuctionRequest = new QueryRequest({
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
        values: [DateUtils.getCurrentTimestamp().toString()],
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
