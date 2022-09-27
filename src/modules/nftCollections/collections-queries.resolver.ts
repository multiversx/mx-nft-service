import {
  Resolver,
  Args,
  Query,
  ResolveField,
  Parent,
  Int,
} from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Collection, CollectionAsset } from './models';
import { CollectionsService } from './collections.service';
import CollectionResponse from './models/CollectionResponse';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { Account } from '../account-stats/models';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { OnSaleAssetsCountForCollectionProvider } from './loaders/onsale-assets-count.loader';
import { Address } from '@elrondnetwork/erdjs/out';
import { ArtistAddressProvider } from '../artists/artists.loader';
import { AssetsCollectionsProvider } from '../assets/loaders/assets-collection.loader';
import { Asset, AssetsResponse } from '../assets/models';
import { Nft } from 'src/common';
import {
  CollectionsFilter,
  CollectionsSortingEnum,
} from './models/Collections-Filters';

@Resolver(() => Collection)
export class CollectionsQueriesResolver extends BaseResolver(Collection) {
  constructor(
    private collectionsService: CollectionsService,
    private accountsProvider: AccountsProvider,
    private artistAddressProvider: ArtistAddressProvider,
    private assetProvider: AssetsCollectionsProvider,
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
    const { limit, offset } = pagination.pagingParams();
    const [collections, count] = await this.collectionsService.getCollections(
      offset,
      limit,
      filters,
      sorting,
    );

    return PageResponse.mapResponse<Collection>(
      collections || [],
      pagination,
      count || 0,
      offset,
      limit,
    );
  }

  @Query(() => CollectionResponse)
  async trendingCollections(
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<CollectionResponse> {
    const { limit, offset } = pagination.pagingParams();
    const [collections, count] =
      await this.collectionsService.getTrendingCollections(offset, limit);

    return PageResponse.mapResponse<Collection>(
      collections || [],
      pagination,
      count || 0,
      offset,
      limit,
    );
  }

  @ResolveField('owner', () => Account)
  async owner(@Parent() auction: Collection) {
    const { ownerAddress } = auction;

    if (!ownerAddress) return null;
    const account = await this.accountsProvider.load(ownerAddress);
    return Account.fromEntity(account?.value ?? null, ownerAddress);
  }

  @ResolveField('artist', () => Account)
  async artist(@Parent() auction: Collection) {
    const { ownerAddress, artistAddress } = auction;

    if (artistAddress) {
      const account = await this.accountsProvider.load(artistAddress);
      return Account.fromEntity(account?.value, artistAddress);
    }

    if (!ownerAddress) return null;

    const address = new Address(ownerAddress);
    let artist: string = ownerAddress;
    if (address.isContractAddress()) {
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
  async collectionAssets(
    @Parent() collectionResponse: Collection,
  ): Promise<CollectionAsset> {
    const { collection, collectionAsset } = collectionResponse;
    if (collectionAsset) return collectionAsset;
    return new CollectionAsset({
      collectionIdentifer: collection,
    });
  }

  @ResolveField('assets', () => AssetsResponse)
  async assets(
    @Parent() collectionResponse: Collection,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<AssetsResponse> {
    const { collection } = collectionResponse;
    const { limit, offset } = pagination.pagingParams();

    if (!collection) return null;
    const assets = await this.assetProvider.load(
      `${collection}_${offset}_${limit}`,
    );
    const assetsValue = assets?.value;
    return PageResponse.mapResponse<Asset>(
      assetsValue?.nfts?.map((n: Nft) => Asset.fromNft(n)),
      pagination,
      assetsValue?.count ?? 0,
      offset,
      limit,
    );
  }
}
