import { FiltersExpression, Sorting, Grouping } from './filtersTypes';
import { AuctionCustomFilter } from './AuctionCustomFilters';

export class QueryRequest {
  limit: number = 20;
  offset: number = 0;
  filters: FiltersExpression;
  sorting: Sorting[];
  groupByOption: Grouping;
  customFilters: AuctionCustomFilter[];

  constructor(init?: Partial<QueryRequest>) {
    Object.assign(this, init);
  }
}
