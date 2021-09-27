import { Resolver, ResolveField, Parent, Int } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { MinBid, Price } from '../assets/models';
import { DataServiceUSD } from '../data.service.usd';

@Resolver(() => MinBid)
export class MinBidResolver extends BaseResolver(MinBid) {
  constructor(private dataService: DataServiceUSD) {
    super();
  }

  @ResolveField(() => Number)
  async usdAmount(@Parent() auction: Price) {
    const { timestamp } = auction;
    return (await this.dataService.getPriceForTimestamp(timestamp)).toString();
  }
}
