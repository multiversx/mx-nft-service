import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Token {
  @Field(() => String)
  identifier: string;
  @Field(() => String)
  symbol: string;
  @Field(() => String)
  name: string;
  @Field(() => String, { nullable: true })
  priceUsd?: string;
  @Field(() => Number)
  decimals: number;
  @Field(() => Int, { nullable: true })
  activeAuctions?: number;

  constructor(init?: Partial<Token>) {
    Object.assign(this, init);
  }

  static fromElrondApiDexToken(token: any): Token {
    return new Token({
      identifier: token.id,
      symbol: token.symbol,
      name: token.name,
      priceUsd: token.price,
    });
  }

  static fromElrondApiToken(token: any): Token {
    return new Token({
      identifier: token.identifier,
      symbol: token.ticker,
      name: token.name,
      decimals: token.decimals,
    });
  }
}
