import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Price } from '../assets/models';
import { UsdPriceService } from './usd-price.service';
import { Token } from 'src/common/services/elrond-communication/models/Token.model';

@Resolver(() => Price)
export class UsdPriceResolver extends BaseResolver(Price) {
  constructor(private readonly usdPriceService: UsdPriceService) {
    super();
  }

  @ResolveField(() => String)
  async usdAmount(@Parent() price: Price) {
    return this.usdPriceService.getUsdAmountDenom(
      price.token,
      price.amount,
      price.timestamp,
    );
  }

  @ResolveField(() => Token)
  async tokenData(@Parent() price: Price) {
    return this.usdPriceService.getToken(price.token);
  }
}
