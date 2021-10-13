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
} from './models';
import { IssueCollectionArgs } from './models';
import { SetNftRolesArgs } from './models';
import { TransactionNode } from '../transaction';
import { CollectionsService } from './collection.service';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { UseGuards } from '@nestjs/common';
import CollectionResponse from './models/CollectionResponse';
import { CollectionsFilter } from '../filtersTypes';
import ConnectionArgs from '../ConnectionArgs';
import PageResponse from '../PageResponse';
import { AccountsProvider } from '../accounts/accounts.loader';
import { Account } from '../accounts/models';

@Resolver(() => Collection)
export class CollectionsResolver extends BaseResolver(Collection) {
  constructor(
    private collectionsService: CollectionsService,
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
    filters,
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

  @ResolveField('issuer', () => Account)
  async issuer(@Parent() auction: Collection) {
    const { issuerAddress } = auction;

    if (!issuerAddress) return null;
    const account = await this.accountsProvider.getAccountByAddress(
      issuerAddress,
    );
    return Account.fromEntity(account);
  }
}
