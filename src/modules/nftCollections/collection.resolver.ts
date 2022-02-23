import {
  Resolver,
  Args,
  Mutation,
  Query,
  ResolveField,
  Parent,
  Int,
} from '@nestjs/graphql';
import {
  StopNftCreateArgs,
  Collection,
  TransferNftCreateRoleArgs,
  IssueCollectionArgs,
  SetNftRolesArgs,
  CollectionAsset,
  CollectionAssetModel,
} from './models';
import { TransactionNode } from '../common/transaction';
import { CollectionsService } from './collection.service';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { UseGuards } from '@nestjs/common';
import CollectionResponse from './models/CollectionResponse';
import {
  AssetsFilter,
  CollectionsFilter,
} from '../common/filters/filtersTypes';
import ConnectionArgs from '../common/filters/ConnectionArgs';
import PageResponse from '../common/filters/PageResponse';
import { AssetsService } from '../assets';
import { Account } from '../account-stats/models';
import { BaseResolver } from '../common/base.resolver';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';

@Resolver(() => Collection)
export class CollectionsResolver extends BaseResolver(Collection) {
  constructor(
    private collectionsService: CollectionsService,
    private assetsService: AssetsService,
    private accountsProvider: AccountsProvider,
  ) {
    super();
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async issueNftCollection(
    @Args('input') input: IssueCollectionArgs,
  ): Promise<TransactionNode> {
    if (process.env.NODE_ENV === 'production') {
      return new TransactionNode();
    }
    return await this.collectionsService.issueNft(input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async issueSftCollection(
    @Args('input') input: IssueCollectionArgs,
  ): Promise<TransactionNode> {
    if (process.env.NODE_ENV === 'production') {
      return new TransactionNode();
    }
    return await this.collectionsService.issueSemiFungible(input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async setRoles(
    @Args('input') input: SetNftRolesArgs,
  ): Promise<TransactionNode> {
    if (process.env.NODE_ENV === 'production') {
      return new TransactionNode();
    }
    return await this.collectionsService.setNftRoles(input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async transferNftCreateRole(
    @Args('input') input: TransferNftCreateRoleArgs,
  ): Promise<TransactionNode> {
    if (process.env.NODE_ENV === 'production') {
      return new TransactionNode();
    }
    return await this.collectionsService.transferNFTCreateRole(input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async stopNftCreate(
    @Args('input') input: StopNftCreateArgs,
  ): Promise<TransactionNode> {
    if (process.env.NODE_ENV === 'production') {
      return new TransactionNode();
    }
    return await this.collectionsService.stopNFTCreate(input);
  }

  @Query(() => CollectionResponse)
  async collections(
    @Args({ name: 'filters', type: () => CollectionsFilter, nullable: true })
    filters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<CollectionResponse> {
    if (process.env.NODE_ENV === 'production') {
      return new CollectionResponse();
    }
    const { limit, offset } = pagination.pagingParams();
    const [collections, count] = await this.collectionsService.getCollections(
      offset,
      limit,
      filters,
    );
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
    return Account.fromEntity(account, ownerAddress);
  }

  @ResolveField('collectionAsset', () => CollectionAsset)
  async assets(
    @Parent() auction: Collection,
    @Args('assetsCount', { nullable: true, type: () => Int })
    assetsCount: number = 4,
  ) {
    const { collection } = auction;

    const [assets, count] = await this.assetsService.getAssetsForCollection(
      new AssetsFilter({ collection: collection }),
      assetsCount,
    );
    return new CollectionAsset({
      assets: assets?.map(
        (a) =>
          new CollectionAssetModel({
            thumbnailUrl: a.media?.length > 0 ? a.media[0].thumbnailUrl : null,
            identifier: a.identifier,
          }),
      ),
      totalCount: count,
    });
  }
}
