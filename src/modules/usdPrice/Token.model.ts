import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ApiToken, DexToken } from '../../common/services/mx-communication/models/api-token.model';

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

  static fromMxApiDexToken(token: DexToken): Token {
    return new Token({
      identifier: token.id,
      symbol: token.symbol,
      name: token.name,
      priceUsd: token.price,
    });
  }

  static fromMxApiToken(token: ApiToken): Token {
    return new Token({
      identifier: token.identifier,
      symbol: token.ticker,
      name: token.name,
      decimals: token.decimals,
      priceUsd: token.price,
    });
  }
}
