import { Address } from '@multiversx/sdk-core';
import { Args, Int, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Nft } from 'src/common';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { Account } from '../account-stats/models';
import { ArtistAddressProvider } from '../artists/artists.loader';
import { AssetsCollectionsForOwnerProvider } from '../assets/loaders/assets-collection-for-owner.loader';
import { AssetsCollectionsProvider } from '../assets/loaders/assets-collection.loader';
import { Asset, AssetsResponse } from '../assets/models';
import { BaseResolver } from '../common/base.resolver';
import ConnectionArgs, { getPagingParameters } from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { CollectionNftTrait } from '../nft-traits/models/collection-traits.model';
import { CollectionsGetterService } from './collections-getter.service';
import { CollectionAssetsCountProvider } from './loaders/collection-assets-count.loader';
import { OnSaleAssetsCountForCollectionProvider } from './loaders/onsale-assets-count.loader';
import { Collection, CollectionAsset } from './models';
import CollectionResponse from './models/CollectionResponse';
import { AssetsCollectionFilter, CollectionsFilter, CollectionsSortingEnum } from './models/Collections-Filters';

@Resolver(() => Collection)
export class CollectionsQueriesResolver extends BaseResolver(Collection) {
  constructor(
    private collectionsGetterService: CollectionsGetterService,
    private accountsProvider: AccountsProvider,
    private artistAddressProvider: ArtistAddressProvider,
    private collectionAssetsCountProvider: CollectionAssetsCountProvider,
    private assetProvider: AssetsCollectionsProvider,
    private assetByOwnerProvider: AssetsCollectionsForOwnerProvider,
    private onSaleAssetsCountProvider: OnSaleAssetsCountForCollectionProvider,
  ) {
    super();
  }

  @Query(() => CollectionResponse)
  async collections(
    @Args({ name: 'filters', type: () => CollectionsFilter, nullable: true })
    filters: CollectionsFilter,
    @Args({
      name: 'sorting',
      type: () => CollectionsSortingEnum,
      nullable: true,
    })
    sorting: CollectionsSortingEnum,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<CollectionResponse> {
    const { limit, offset } = getPagingParameters(pagination);
    const [collections, count] = await this.collectionsGetterService.getCollections(offset, limit, filters, sorting);

    return PageResponse.mapResponse<Collection>(collections || [], pagination, count || 0, offset, limit);
  }

  @ResolveField('owner', () => Account)
  async owner(@Parent() collectionNode: Collection) {
    const { ownerAddress } = collectionNode;

    if (!ownerAddress) return null;
    const account = await this.accountsProvider.load(ownerAddress);
    return Account.fromEntity(account?.value ?? null, ownerAddress);
  }

  @ResolveField('nftsCount', () => Account)
  async nftsCount(@Parent() collectionNode: Collection) {
    const { nftsCount, collection } = collectionNode;

    if (nftsCount) return nftsCount;
    const assetsCount = await this.collectionAssetsCountProvider.load(collection);
    return assetsCount?.value ?? 0;
  }

  @ResolveField('artist', () => Account)
  async artist(@Parent() collectionNode: Collection) {
    const { ownerAddress, artistAddress } = collectionNode;

    if (artistAddress) {
      const account = await this.accountsProvider.load(artistAddress);
      return Account.fromEntity(account?.value, artistAddress);
    }

    if (!ownerAddress) return null;

    const address = Address.newFromBech32(ownerAddress);
    let artist: string = ownerAddress;
    if (address.isSmartContract()) {
      const response = await this.artistAddressProvider.load(ownerAddress);
      artist = response?.value ? response?.value?.owner : ownerAddress;
    }

    const account = await this.accountsProvider.load(artist);
    return Account.fromEntity(account?.value, artist);
  }

  @ResolveField('onSaleAssetsCount', () => Int)
  async onSaleAssetsCount(@Parent() node: Collection) {
    const { collection } = node;

    if (!collection) return 0;
    const onSaleCount = await this.onSaleAssetsCountProvider.load(collection);
    return onSaleCount?.value?.Count ?? 0;
  }

  @ResolveField('collectionAsset', () => CollectionAsset)
  async collectionAssets(@Parent() collectionResponse: Collection): Promise<CollectionAsset> {
    const { collection, collectionAsset } = collectionResponse;
    if (collectionAsset) return collectionAsset;
    return new CollectionAsset({
      collectionIdentifer: collection,
    });
  }

  @ResolveField('assets', () => AssetsResponse)
  async assets(
    @Parent() collectionResponse: Collection,
    @Args({
      name: 'pagination',
      type: () => ConnectionArgs,
      nullable: true,
      description: 'This filter will be removed in the next version, we return the latest 10 assets for this collection',
    })
    pagination: ConnectionArgs,
    @Args({
      name: 'filters',
      type: () => AssetsCollectionFilter,
      nullable: true,
    })
    filters: AssetsCollectionFilter,
  ): Promise<AssetsResponse> {
    const { collection } = collectionResponse;

    if (!collection) return null;
    if (filters?.ownerAddress) {
      const assets = await this.assetByOwnerProvider.load(`${collection}_${filters.ownerAddress}`);
      const assetsValue = assets?.value;
      return PageResponse.mapResponse<Asset>(
        assetsValue?.nfts?.map((n: Nft) => Asset.fromNft(n)) ?? [],
        pagination,
        assetsValue?.count ?? 0,
        0,
        10,
      );
    }
    const assets = await this.assetProvider.load(collection);
    const assetsValue = assets?.value;

    return PageResponse.mapResponse<Asset>(
      assetsValue?.nfts?.map((n: Nft) => Asset.fromNft(n)) ?? [],
      pagination,
      assetsValue?.count ?? 0,
      0,
      10,
    );
  }

  @ResolveField('description')
  async description(@Parent() node: Collection): Promise<string> {
    return node.description ?? (await this.collectionsGetterService.getRandomCollectionDescription(node));
  }

  @ResolveField('traits')
  async traits(@Parent() collectionNode: Collection): Promise<CollectionNftTrait[]> {
    return collectionNode.traits ?? (await this.collectionsGetterService.getCollectionTraits(collectionNode.collection));
  }

  @ResolveField(() => String)
  aggregatorUrl(@Parent() collectionNode: Collection): string {
    return `${process.env.ELROND_MARKETPLACE}/collections/${collectionNode.collection}`;
  }
}
