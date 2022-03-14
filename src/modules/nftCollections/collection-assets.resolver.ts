import { Resolver, ResolveField, Parent } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { CollectionAsset } from './models';
import { CollectionAssetsProvider } from './loaders/collection-assets.loader';
import { CollectionAssetsCountProvider } from './loaders/collection-assets-count.loader';

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

    console.log('$$$$$$$$$$$', { totalCount, collectionIdentifer });
    if (!collectionIdentifer) return null;
    if (totalCount) return totalCount;
    console.log('11111111', { totalCount, collectionIdentifer });
    const assetsCount = await this.collectionAssetsCountProvider.load(
      collectionIdentifer,
    );
    return assetsCount.totalCount;
  }

  @ResolveField('assets', () => CollectionAsset)
  async assets(@Parent() collectionAsset: CollectionAsset) {
    const { collectionIdentifer, assets } = collectionAsset;
    console.log('##########', { collectionIdentifer });
    if (assets) return assets;
    console.log('222222222222222', { collectionIdentifer });
    const response = await this.collectionAssetsProvider.load(
      collectionIdentifer,
    );
    return response?.value ?? [];
  }
}
