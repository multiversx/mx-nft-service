import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Token {
  @Field(() => String)
  identifier: string;
  @Field(() => String, { nullable: true })
  symbol?: string;
  @Field(() => String, { nullable: true })
  name?: string;
  @Field(() => String, { nullable: true })
  priceUsd?: string;
  @Field(() => Number, { nullable: true })
  decimals?: number;
  @Field(() => Int, { nullable: true })
  activeAuctions?: number;

  constructor(init?: Partial<Token>) {
    Object.assign(this, init);
  }

  static fromElrondApiToken(token: any): Token {
    return new Token({
      identifier: token.id,
      symbol: token.ticker,
      name: token.name,
      decimals: token.decimals,
    });
  }
}
