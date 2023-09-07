import { Resolver, ResolveField, Parent, Args } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { CollectionAsset } from './models';
import { CollectionAssetsProvider } from './loaders/collection-assets.loader';
import { CollectionAssetsCountProvider } from './loaders/collection-assets-count.loader';
import { CollectionAssetsRetriveCount } from './CollectionAssetsRetriveCount';

@Resolver(() => CollectionAsset)
export class CollectionAssetsResolver extends BaseResolver(CollectionAsset) {
  constructor(
    private collectionAssetsProvider: CollectionAssetsProvider,
    private collectionAssetsCountProvider: CollectionAssetsCountProvider,
  ) {
    super();
  }

  @ResolveField('totalCount', () => String)
  async totalCount(@Parent() collectionAsset: CollectionAsset) {
    const { collectionIdentifer, totalCount } = collectionAsset;

    if (!collectionIdentifer) return null;
    if (totalCount) return totalCount;
    const assetsCount = await this.collectionAssetsCountProvider.load(collectionIdentifer);
    return assetsCount?.value ?? 0;
  }

  @ResolveField('assets', () => CollectionAsset)
  async assets(
    @Parent() collectionAsset: CollectionAsset,
    @Args('input', { type: () => CollectionAssetsRetriveCount, nullable: true })
    input: CollectionAssetsRetriveCount,
  ) {
    const { collectionIdentifer, assets } = collectionAsset;
    if (assets) return assets?.slice(0, input.size);
    const response = await this.collectionAssetsProvider.load(collectionIdentifer);
    if (response?.value) {
      return response?.value?.slice(0, input.size);
    }
    return [];
  }
}
