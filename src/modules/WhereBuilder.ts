import { isEmpty, map } from 'lodash';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';
import { Filter, FiltersExpression, Operation, Operator } from './filtersTypes';
import denominate from './formatters';

type ParamValue = string | number | Array<string | number>;

export default class WhereBuilder<Entity> {
  private params: Record<string, ParamValue> = {};
  private paramsCount = 0;

  constructor(
    private readonly queryBuilder: SelectQueryBuilder<Entity>,
    private filtersExpression?: FiltersExpression,
    private queryBuilderName?: string,
  ) {}

  build() {
    if (!this.filtersExpression) return;

    const whereSql = this.buildExpressionRec(this.filtersExpression);
    this.queryBuilder.where(whereSql, this.params);
  }

  private buildExpressionRec(fe: FiltersExpression): string {
    const filters = map(fe.filters, (f) => this.buildFilter(f));

    const allSqlBlocks = [...filters];
    const sqLExpr = allSqlBlocks.join(` ${Operator[fe.operator]} `);
    return isEmpty(sqLExpr) ? '' : `(${sqLExpr})`;
  }

  private buildFilter(filter: Filter): string {
    const paramName = `${filter.field}_${++this.paramsCount}`;
    let filterName = `${filter.field}`;
    let filterValues = filter.values;
    if (['priceAmount', 'minBid', 'maxBid'].includes(filter.field)) {
      filterName = `${filter.field}Denominated`;
      filterValues = filter.values.map((value) =>
        denominate({
          input: value,
          denomination: 18,
          decimals: 2,
          showLastNonZeroDecimal: true,
        }),
      );
    }
    const sqlParamName = this.queryBuilderName
      ? `${this.queryBuilderName}.${filterName}`
      : filterName;

    switch (filter.op) {
      case Operation.EQ:
        this.params[paramName] = filterValues[0];
        return `${sqlParamName} = :${paramName}`;
      case Operation.IN:
        this.params[paramName] = filterValues;
        if (filter.field === 'tags') {
          return this.getTagsFilter(filter, sqlParamName);
        }
        return `${sqlParamName} IN (:${paramName})`;
      case Operation.LIKE:
        this.params[paramName] = `%${filterValues[0]}%`;
        return `${sqlParamName} LIKE :${paramName}`;
      case Operation.GE:
        this.params[paramName] = `${filterValues[0]}`;
        return `${sqlParamName} >= :${paramName}`;
      case Operation.LE:
        this.params[paramName] = `${filterValues[0]}`;
        return `${sqlParamName} <= :${paramName}`;
      case Operation.BETWEEN:
        this.params[paramName] = `%${filterValues[0]}%`;
        return `${sqlParamName} BETWEEN '${filterValues[0]}' AND '${filterValues[1]}'`;
      default:
        throw new Error(`Unknown filter operation: ${filter.op}`);
    }
  }

  private getTagsFilter(filter: Filter, paramName: string) {
    let filterQuery = '';
    filter.values.forEach((element) => {
      filterQuery =
        filterQuery === ''
          ? `FIND_IN_SET('${element}', ${paramName}) `
          : `${filterQuery} AND FIND_IN_SET('${element}', ${paramName}) `;
    });
    return filterQuery;
  }
}
