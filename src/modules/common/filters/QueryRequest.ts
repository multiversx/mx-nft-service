import { FiltersExpression, Sorting, Grouping, Operation, Sort, Filter } from './filtersTypes';
import { AuctionCustomEnum, AuctionCustomFilter } from './AuctionCustomFilters';

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

  getFilter(name: string): Filter | undefined {
    return this.filters?.filters?.find((x) => x.field === name);
  }

  getFilterName(name: string): string | undefined {
    const values = this.filters?.filters?.find((x) => x.field === name)?.values;

    if (!values || values.length === 0) {
      return undefined;
    }

    return values[0];
  }

  getAllFilters(): Record<string, string> {
    if (!this.filters || !this.filters.filters) {
      return {};
    }

    const result: Record<string, string> = {};

    for (const filter of this.filters.filters) {
      if (!filter.values || filter.values.length === 0 || (filter.values.length === 1 && !filter.values[0])) {
        continue;
      }

      result[filter.field] = filter.values[0];
    }

    return result;
  }

  getRange(field: AuctionCustomEnum): { startPrice: string; endPrice: string } | undefined {
    const customFilters = this.customFilters;
    if (!customFilters) {
      return undefined;
    }

    const customFilter = customFilters.find((x) => x.field === field && x.op === Operation.BETWEEN);
    if (!customFilter) {
      return undefined;
    }

    const values = customFilters[0].values;
    if (!values || values.length !== 2) {
      return undefined;
    }

    return {
      startPrice: values[0],
      endPrice: values[1],
    };
  }

  getCustomFilterSort(field: AuctionCustomEnum): { field: string; direction: Sort } | undefined {
    const customFilters = this.customFilters;
    if (!customFilters) {
      return undefined;
    }
    const customFilter = customFilters.find((x) => x.field === field && x.op === Operation.BETWEEN);
    if (!customFilter.sort) {
      return undefined;
    }

    return {
      field: 'startBid',
      direction: customFilter.sort.direction,
    };
  }

  getSort(): { field: string; direction: Sort } | undefined {
    if (!this.sorting || this.sorting.length === 0) {
      return undefined;
    }

    return this.sorting[0];
  }
}
