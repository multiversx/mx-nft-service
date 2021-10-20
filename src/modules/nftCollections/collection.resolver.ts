import {
  Resolver,
  Args,
  Mutation,
  Query,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import {
  StopNftCreateArgs,
  Collection,
  TransferNftCreateRoleArgs,
  IssueCollectionArgs,
  SetNftRolesArgs,
  CollectionAsset,
  CollectionAssetModel,
} from './models';
import { TransactionNode } from '../transaction';
import { CollectionsService } from './collection.service';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { UseGuards } from '@nestjs/common';
import CollectionResponse from './models/CollectionResponse';
import { AssetsFilter, CollectionsFilter } from '../filtersTypes';
import ConnectionArgs from '../ConnectionArgs';
import PageResponse from '../PageResponse';
import { AccountsProvider } from '../accounts/accounts.loader';
import { Account } from '../accounts/models';
import { AssetsService } from '../assets';

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
    return await this.collectionsService.issueNft(input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async issueSftCollection(
    @Args('input') input: IssueCollectionArgs,
  ): Promise<TransactionNode> {
    return await this.collectionsService.issueSemiFungible(input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async setRoles(
    @Args('input') input: SetNftRolesArgs,
  ): Promise<TransactionNode> {
    return await this.collectionsService.setNftRoles(input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async transferNftCreateRole(
    @Args('input') input: TransferNftCreateRoleArgs,
  ): Promise<TransactionNode> {
    return await this.collectionsService.transferNFTCreateRole(input);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async stopNftCreate(
    @Args('input') input: StopNftCreateArgs,
  ): Promise<TransactionNode> {
    return await this.collectionsService.stopNFTCreate(input);
  }

  @Query(() => CollectionResponse)
  async collections(
    @Args({ name: 'filters', type: () => CollectionsFilter, nullable: true })
    filters: CollectionsFilter,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<CollectionResponse> {
    const { limit, offset } = pagination.pagingParams();
    const [collections, count] = await this.collectionsService.getCollections(
      offset,
      limit,
      filters,
    );
    return PageResponse.mapResponse<Collection>(
      collections,
      pagination,
      count,
      offset,
      limit,
    );
  }

  @ResolveField('owner', () => Account)
  async owner(@Parent() auction: Collection) {
    const { ownerAddress } = auction;

    if (!ownerAddress) return null;
    const account = await this.accountsProvider.getAccountByAddress(
      ownerAddress,
    );
    return Account.fromEntity(account);
  }

  @ResolveField('collectionAsset', () => CollectionAsset)
  async assets(@Parent() auction: Collection) {
    const { collection } = auction;

    const [assets, count] = await this.assetsService.getAssetsForCollection(
      new AssetsFilter({ collection: collection }),
    );
    return new CollectionAsset({
      assets: assets.map(
        (a) =>
          new CollectionAssetModel({
            thumbnailUrl: a.thumbnailUrl,
            identifier: a.identifier,
          }),
      ),
      totalCount: count,
    });
  }
}
