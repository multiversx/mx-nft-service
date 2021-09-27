import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { Price } from '../assets/models';
import { DataServiceUSD } from '../data.service.usd';
import { usdValue } from '../transactionsProcessor/helpers';
import denominate from '../formatters';

@Resolver(() => Price)
export class OrderPriceResolver extends BaseResolver(Price) {
  constructor(private dataService: DataServiceUSD) {
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
          await this.dataService.getPriceForTimestamp(timestamp),
          2,
        )
      : null;
  }
}
