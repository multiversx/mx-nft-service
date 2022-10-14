import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import {
  StopNftCreateArgs,
  Collection,
  TransferNftCreateRoleArgs,
  IssueCollectionArgs,
  SetNftRolesArgs,
} from './models';
import { CollectionsTransactionsService } from './collections-transactions.service';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { UseGuards } from '@nestjs/common';
import { TransactionNode } from '../common/transaction';
import {
  IssueCollectionRequest,
  SetNftRolesRequest,
  TransferNftCreateRoleRequest,
  StopNftCreateRequest,
} from './models/requests';
import { User } from '../auth/user';

@Resolver(() => Collection)
export class CollectionsMutationsResolver extends BaseResolver(Collection) {
  constructor(
    private collectionsTransactionsService: CollectionsTransactionsService,
  ) {
    super();
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async issueNftCollection(
    @Args('input', { type: () => IssueCollectionArgs })
    input: IssueCollectionArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = IssueCollectionRequest.fromArgs(input, 'issueNonFungible');
    return await this.collectionsTransactionsService.issueToken(
      user.publicKey,
      request,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async issueSftCollection(
    @Args('input', { type: () => IssueCollectionArgs })
    input: IssueCollectionArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = IssueCollectionRequest.fromArgs(input, 'issueSemiFungible');
    return await this.collectionsTransactionsService.issueToken(
      user.publicKey,
      request,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async setRoles(
    @Args('input', { type: () => SetNftRolesArgs }) input: SetNftRolesArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = SetNftRolesRequest.fromArgs(input);
    return await this.collectionsTransactionsService.setNftRoles(
      user.publicKey,
      request,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async transferNftCreateRole(
    @Args('input', { type: () => TransferNftCreateRoleArgs })
    input: TransferNftCreateRoleArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = TransferNftCreateRoleRequest.fromArgs(input);
    return await this.collectionsTransactionsService.transferNFTCreateRole(
      user.publicKey,
      request,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async stopNftCreate(
    @Args('input', { type: () => StopNftCreateArgs }) input: StopNftCreateArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = StopNftCreateRequest.fromArgs(input);
    return await this.collectionsTransactionsService.stopNFTCreate(
      user.publicKey,
      request,
    );
  }
}
