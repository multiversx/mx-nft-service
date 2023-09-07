import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { StopNftCreateArgs, Collection, TransferNftCreateRoleArgs, IssueCollectionArgs, SetNftRolesArgs } from './models';
import { CollectionsTransactionsService } from './collections-transactions.service';
import { UseGuards } from '@nestjs/common';
import { TransactionNode } from '../common/transaction';
import { IssueCollectionRequest, SetNftRolesRequest, TransferNftCreateRoleRequest, StopNftCreateRequest } from './models/requests';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { AuthUser } from '../auth/authUser';
import { UserAuthResult } from '../auth/userAuthResult';

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

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async transferNftCreateRole(
    @Args('input', { type: () => TransferNftCreateRoleArgs })
    input: TransferNftCreateRoleArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = TransferNftCreateRoleRequest.fromArgs(input);
    return await this.collectionsTransactionsService.transferNFTCreateRole(user.address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async stopNftCreate(
    @Args('input', { type: () => StopNftCreateArgs }) input: StopNftCreateArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = StopNftCreateRequest.fromArgs(input);
    return await this.collectionsTransactionsService.stopNFTCreate(user.address, request);
  }
}
