import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Price } from '../assets/models';
import { usdValue } from 'src/utils/helpers';
import denominate from 'src/utils/formatters';
import { UsdPriceLoader } from './loaders/usd-price.loader';

@Resolver(() => Price)
export class UsdAmountResolver extends BaseResolver(Price) {
  constructor(private usdPriceLoader: UsdPriceLoader) {
    super();
  }

  @ResolveField(() => String)
  async usdAmount(@Parent() price: Price) {
    const { timestamp, amount, token } = price;
    if (token.toLocaleLowerCase() === 'egld') {
      const priceUsd = await this.usdPriceLoader.load(timestamp);
      const priceUsdRedisValue = priceUsd.value;

      return timestamp
        ? usdValue(
            denominate({
              input: amount,
              denomination: 18,
              decimals: 18,
              showLastNonZeroDecimal: true,
            }).replace(',', ''),
            priceUsdRedisValue?.value,
            2,
          )
        : null;
    }
  }
}
