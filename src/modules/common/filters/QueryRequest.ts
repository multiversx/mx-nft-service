import { FiltersExpression, Sorting, Grouping } from './filtersTypes';
import { AuctionCustomFilters } from './AuctionCustomFilters';

export class QueryRequest {
  limit: number = 20;
  offset: number = 0;
  filters: FiltersExpression;
  sorting: Sorting[];
  groupByOption: Grouping;
  customFilters: AuctionCustomFilters[];

  constructor(init?: Partial<QueryRequest>) {
    Object.assign(this, init);
  }
}
