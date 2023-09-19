import { Repository } from 'typeorm';
import { SelectQueryBuilder } from 'typeorm/query-builder/SelectQueryBuilder';
import { FiltersExpression } from './filtersTypes';
import JoinBuilder from './JoinBuilder';
import WhereBuilder from './WhereBuilder';

export default class FilterQueryBuilder<Entity> {
  private readonly queryBuilder: SelectQueryBuilder<Entity>;

  constructor(entityRepository: Repository<Entity>, private filtersExpression?: FiltersExpression, private queryBuilderName?: string) {
    this.queryBuilder = entityRepository.createQueryBuilder(queryBuilderName);
  }

  build() {
    const joinBuilder = new JoinBuilder<Entity>(this.queryBuilder, this.filtersExpression);
    joinBuilder.build();

    const whereBuilder = new WhereBuilder<Entity>(this.queryBuilder, this.filtersExpression, this.queryBuilderName);
    whereBuilder.build();

    return this.queryBuilder;
  }
}
