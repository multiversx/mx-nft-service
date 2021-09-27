import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { TopBid } from '../assets/models';
import { DataServiceUSD } from '../data.service.usd';

@Resolver(() => TopBid)
export class TopBidResolver extends BaseResolver(TopBid) {
  constructor(private dataService: DataServiceUSD) {
    super();
  }

  @ResolveField(() => Number)
  async usdAmount(@Parent() price: TopBid) {
    const { timestamp } = price;
    return (await this.dataService.getPriceForTimestamp(timestamp)).toString();
  }
}
