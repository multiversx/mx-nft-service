import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { Token } from './Token.model';
import { BaseResolver } from '../common/base.resolver';
import { UsdPriceService } from './usd-price.service';

@Resolver(() => Token)
export class UsdTokenPriceResolver extends BaseResolver(Token) {
  constructor(private readonly usdPriceService: UsdPriceService) {
    super();
  }

  @ResolveField(() => String)
  async priceUsd(@Parent() token: Token) {
    return token.priceUsd ?? (await this.usdPriceService.getTokenPriceUsd(token.identifier));
  }
}
