import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { OrderPrice } from '../assets/models';
import { DataServiceUSD } from '../data.service.usd';
import { usdValue } from '../transactionsProcessor/helpers';
import denominate from '../formatters';

@Resolver(() => OrderPrice)
export class OrderPriceResolver extends BaseResolver(OrderPrice) {
  constructor(private dataService: DataServiceUSD) {
    super();
  }

  @ResolveField(() => String)
  async usdAmount(@Parent() price: OrderPrice) {
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
        )
      : null;
  }
}
