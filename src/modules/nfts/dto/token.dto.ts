import { ID, ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class TokenType {
  @Field(() => ID)
  tokenTicker!: string;
  @Field()
  tokenName!: string;
}
