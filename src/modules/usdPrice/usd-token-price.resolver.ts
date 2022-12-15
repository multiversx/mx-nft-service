import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { UsdPriceService } from './usd-price.service';
import { Token } from 'src/common/services/elrond-communication/models/Token.model';

@Resolver(() => Token)
export class UsdTokenPriceResolver extends BaseResolver(Token) {
  constructor(private readonly usdPriceService: UsdPriceService) {
    super();
  }

  @ResolveField(() => String)
  async priceUsd(@Parent() token: Token) {
    return (
      token.priceUsd ??
      (await this.usdPriceService.getTokenPriceUsd(token.identifier))
    );
  }
}
