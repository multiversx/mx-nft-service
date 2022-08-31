import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Token {
  @Field(() => String)
  identifier: string;
  @Field(() => String)
  symbol: string;
  @Field(() => String)
  name: string;
  @Field(() => String)
  priceUsd: string;
  @Field(() => Number)
  decimals?: number;

  constructor(init?: Partial<Token>) {
    Object.assign(this, init);
  }

  static fromElrondApiToken(token: any): Token {
    return new Token({
      identifier: token.id,
      symbol: token.symbol,
      name: token.name,
      priceUsd: token.price,
      decimals: token.decimals ?? undefined,
    });
  }
}
