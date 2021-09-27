import { Resolver, ResolveField, Parent, Int } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { MinBid, Price } from '../assets/models';
import { DataServiceUSD } from '../data.service.usd';
import denominate from '../formatters';
import { usdValue } from '../transactionsProcessor/helpers';

@Resolver(() => MinBid)
export class MinBidResolver extends BaseResolver(MinBid) {
  constructor(private dataService: DataServiceUSD) {
    super();
  }

  @ResolveField(() => String)
  async usdAmount(@Parent() price: MinBid) {
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
