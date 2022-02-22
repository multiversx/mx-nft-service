import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { Price } from '../assets/models';
import denominate from '../formatters';
import { usdValue } from 'src/utils/helpers';
import { UsdPriceLoader } from './usd-price.loader';

@Resolver(() => Price)
export class UsdAmountResolver extends BaseResolver(Price) {
  constructor(private usdPriceLoader: UsdPriceLoader) {
    super();
  }

  @ResolveField(() => String)
  async usdAmount(@Parent() price: Price) {
    const { timestamp, amount } = price;
    const priceUsd = await this.usdPriceLoader.load(timestamp);

    return timestamp
      ? usdValue(
          denominate({
            input: amount,
            denomination: 18,
            decimals: 18,
            showLastNonZeroDecimal: true,
          }).replace(',', ''),
          priceUsd?.value,
          2,
        )
      : null;
  }
}
