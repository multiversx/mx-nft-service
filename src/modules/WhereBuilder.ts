import { isEmpty, map } from 'lodash';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';
import { Filter, FiltersExpression, Operation, Operator } from './filtersTypes';

type ParamValue = string | number | Array<string | number>;

export default class WhereBuilder<Entity> {
  private params: Record<string, ParamValue> = {};
  private paramsCount = 0;

  constructor(
    private readonly queryBuilder: SelectQueryBuilder<Entity>,
    private filtersExpression?: FiltersExpression,
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

    switch (filter.op) {
      case Operation.EQ:
        this.params[paramName] = filter.values[0];
        return `${filter.field} = :${paramName}`;
      case Operation.IN:
        this.params[paramName] = filter.values;
        if (filter.field === 'tags') {
          return this.getTagsFilter(filter);
        }
        return `${filter.field} IN (:${paramName})`;
      case Operation.LIKE:
        this.params[paramName] = `%${filter.values[0]}%`;
        return `${filter.field} LIKE :${paramName}`;
      case Operation.GE:
        this.params[paramName] = `%${filter.values[0]}%`;
        return `${filter.field} >= :${paramName}`;
      case Operation.LE:
        this.params[paramName] = `%${filter.values[0]}%`;
        return `${filter.field} <= :${paramName}`;
      case Operation.BETWEEN:
        this.params[paramName] = `%${filter.values[0]}%`;
        return `${filter.field} BETWEEN '${filter.values[0]}' AND '${filter.values[1]}'`;
      default:
        throw new Error(`Unknown filter operation: ${filter.op}`);
    }
  }

  private getTagsFilter(filter: Filter) {
    let filterQuery = '';
    filter.values.forEach((element) => {
      filterQuery =
        filterQuery === ''
          ? `FIND_IN_SET('${element}', tags) `
          : `${filterQuery} AND FIND_IN_SET('${element}', tags) `;
    });
    return filterQuery;
  }
}
