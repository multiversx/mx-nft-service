import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { TopBid } from '../assets/models';
import { DataServiceUSD } from '../data.service.usd';
import { usdValue } from '../transactionsProcessor/helpers';
import denominate from '../formatters';

@Resolver(() => TopBid)
export class TopBidResolver extends BaseResolver(TopBid) {
  constructor(private dataService: DataServiceUSD) {
    super();
  }

  @ResolveField(() => String)
  async usdAmount(@Parent() price: TopBid) {
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
