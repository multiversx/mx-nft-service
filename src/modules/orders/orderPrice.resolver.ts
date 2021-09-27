import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { OrderPrice } from '../assets/models';
import { DataServiceUSD } from '../data.service.usd';

@Resolver(() => OrderPrice)
export class OrderPriceResolver extends BaseResolver(OrderPrice) {
  constructor(private dataService: DataServiceUSD) {
    super();
  }

  @ResolveField(() => Number)
  async usdAmount(@Parent() price: OrderPrice) {
    const { timestamp } = price;
    return (await this.dataService.getPriceForTimestamp(timestamp)).toString();
  }
}
