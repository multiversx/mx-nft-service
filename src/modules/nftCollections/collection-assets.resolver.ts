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

    if (!collectionIdentifer) return null;
    if (totalCount) return totalCount;
    const assetsCount = await this.collectionAssetsCountProvider.load(
      collectionIdentifer,
    );
    return assetsCount;
  }

  @ResolveField('assets', () => CollectionAsset)
  async assets(@Parent() collectionAsset: CollectionAsset) {
    const { collectionIdentifer, assets } = collectionAsset;
    if (assets) return assets;
    const response = await this.collectionAssetsProvider.load(
      collectionIdentifer,
    );
    return response;
  }
}
