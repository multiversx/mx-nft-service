import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';

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
}

@InputType()
export class FiltersExpression {
  @Field(() => Operator)
  operator: Operator;
  @Field(() => [Filter])
  filters: [Filter];
}

@InputType()
export class AssetsFilter {
  @Field(() => String, { nullable: true })
  ownerAddress: string;

  @Field(() => String, { nullable: true })
  token: string;
  @Field(() => Int, { nullable: true })
  nonce: number;
  @Field(() => [String], { nullable: true })
  tags: [string];
}
