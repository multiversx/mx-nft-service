import { Repository } from 'typeorm';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';
import { FiltersExpression } from './filtersTypes';
import JoinBuilder from './JoinBuilder';
import WhereBuilder from './WhereBuilder';

export default class FilterQueryBuilder<Entity> {
  private readonly queryBuilder: SelectQueryBuilder<Entity>;

  constructor(
    entityRepository: Repository<Entity>,
    private filtersExpression?: FiltersExpression,
  ) {
    this.queryBuilder = entityRepository.createQueryBuilder();
  }

  build() {
    const joinBuilder = new JoinBuilder<Entity>(
      this.queryBuilder,
      this.filtersExpression,
    );
    joinBuilder.build();

    const whereBuilder = new WhereBuilder<Entity>(
      this.queryBuilder,
      this.filtersExpression,
    );
    whereBuilder.build();

    return this.queryBuilder;
  }
}
