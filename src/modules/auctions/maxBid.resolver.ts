import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { MaxBid } from '../assets/models';
import { DataServiceUSD } from '../data.service.usd';

@Resolver(() => MaxBid)
export class MaxBidResolver extends BaseResolver(MaxBid) {
  constructor(private dataService: DataServiceUSD) {
    super();
  }

  @ResolveField(() => Number)
  async usdAmount(@Parent() price: MaxBid) {
    const { timestamp } = price;
    return (await this.dataService.getPriceForTimestamp(timestamp)).toString();
  }
}
