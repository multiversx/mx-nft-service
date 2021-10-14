import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { Price } from '../assets/models';
import { PriceServiceUSD } from '../Price.service.usd';
import denominate from '../formatters';
import { usdValue } from 'src/utils/helpers';

@Resolver(() => Price)
export class UsdAmountResolver extends BaseResolver(Price) {
  constructor(private dataService: PriceServiceUSD) {
    super();
  }

  @ResolveField(() => String)
  async usdAmount(@Parent() price: Price) {
    const { timestamp, amount } = price;

    return timestamp
      ? usdValue(
          denominate({
            input: amount,
            denomination: 18,
            decimals: 18,
            showLastNonZeroDecimal: true,
          }),
          await this.dataService.getPriceAtTimestamp(timestamp),
          2,
        )
      : null;
  }
}
