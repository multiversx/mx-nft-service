import { Field, InputType, registerEnumType } from '@nestjs/graphql';

export enum Operator {
  AND,
  OR,
}

export enum Operation {
  EQ,
  IN,
  LIKE,
}

registerEnumType(Operator, {
  name: 'Operator',
});
registerEnumType(Operation, {
  name: 'Operation',
});

@InputType()
export class Filter {
  @Field(() => Operation)
  op: Operation;
  @Field(() => [String])
  values: string;
  @Field(() => String)
  field: string;
  @Field(() => String)
  relationField: String;
}

@InputType()
export class FiltersExpression {
  @Field(() => Operator)
  operator: Operator;
  @Field(() => [Filter])
  filters: [Filter];
  @Field(() => [FiltersExpression])
  childExpressions: [FiltersExpression];
}
