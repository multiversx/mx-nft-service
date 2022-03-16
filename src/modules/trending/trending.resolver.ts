import { Resolver, Query } from '@nestjs/graphql';
import { Asset } from '../assets/models';
import { BaseResolver } from '../common/base.resolver';
import { TrendingService } from './trending.service';

@Resolver(() => Asset)
export class TrendingResolver extends BaseResolver(Asset) {
  constructor(private trendingService: TrendingService) {
    super();
  }

  @Query(() => [Asset])
  async trendingAssets(): Promise<Asset[]> {
    const [assets] = await this.trendingService.getTrendingAssets();
    return assets;
  }
}
