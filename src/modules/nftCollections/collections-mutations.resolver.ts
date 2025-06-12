import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthUser } from '../auth/authUser';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { UserAuthResult } from '../auth/userAuthResult';
import { BaseResolver } from '../common/base.resolver';
import { TransactionNode } from '../common/transaction';
import { CollectionsTransactionsService } from './collections-transactions.service';
import { Collection, IssueCollectionArgs, SetNftRolesArgs } from './models';
import { IssueCollectionRequest, SetNftRolesRequest } from './models/requests';

@Resolver(() => Collection)
export class CollectionsMutationsResolver extends BaseResolver(Collection) {
  constructor(private collectionsTransactionsService: CollectionsTransactionsService) {
    super();
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async issueNftCollection(
    @Args('input', { type: () => IssueCollectionArgs })
    input: IssueCollectionArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = IssueCollectionRequest.fromArgs(input, 'issueNonFungible');
    return await this.collectionsTransactionsService.issueToken(user.address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async issueSftCollection(
    @Args('input', { type: () => IssueCollectionArgs })
    input: IssueCollectionArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = IssueCollectionRequest.fromArgs(input, 'issueSemiFungible');
    return await this.collectionsTransactionsService.issueToken(user.address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async setRoles(
    @Args('input', { type: () => SetNftRolesArgs }) input: SetNftRolesArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = SetNftRolesRequest.fromArgs(input);
    return await this.collectionsTransactionsService.setNftRoles(user.address, request);
  }
}
