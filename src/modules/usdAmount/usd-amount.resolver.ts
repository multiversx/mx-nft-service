import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Price } from '../assets/models';
import { UsdPriceLoader } from './loaders/usd-price.loader';

@Resolver(() => Price)
export class UsdAmountResolver extends BaseResolver(Price) {
  constructor(private readonly usdPriceLoaderService: UsdPriceLoader) {
    super();
  }

  @ResolveField(() => String)
  async usdAmount(@Parent() price: Price) {
    console.log('price', price);
    return this.usdPriceLoaderService.getUsdAmountDenom(
      price.token,
      price.amount,
    );
  }
}
