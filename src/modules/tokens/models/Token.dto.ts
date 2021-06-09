import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class TokenType {
  @Field()
  id: number;
  @Field()
  tokenTicker!: string;
  @Field({ nullable: true })
  token?: string;
  @Field()
  tokenName!: string;
  @Field()
  address!: string;
  @Field()
  creationDate: Date;

  constructor(init?: Partial<TokenType>) {
    Object.assign(this, init);
  }
}
