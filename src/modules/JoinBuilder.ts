import { forEach } from 'lodash';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';
import { FiltersExpression } from './filtersTypes';

export default class JoinBuilder<Entity> {
  private joinedEntities = new Set<string>();

  constructor(
    private readonly queryBuilder: SelectQueryBuilder<Entity>,
    private filtersExpression?: FiltersExpression,
  ) {}

  build() {
    if (this.filtersExpression)
      this.buildJoinEntitiesRec(this.filtersExpression);
  }

  private buildJoinEntitiesRec(fe: FiltersExpression) {
    forEach(fe.filters, (filter: { field: string }) =>
      this.addJoinEntity(filter.field),
    );
  }

  private addJoinEntity(field: string, relationField?: string) {
    const entityName = field.split('.')[0];

    if (relationField && !this.joinedEntities.has(entityName)) {
      this.queryBuilder.leftJoinAndSelect(relationField, entityName);
      this.joinedEntities.add(entityName);
    }
  }
}
