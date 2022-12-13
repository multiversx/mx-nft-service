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
import { UseGuards } from '@nestjs/common';
import { TransactionNode } from '../common/transaction';
import {
  IssueCollectionRequest,
  SetNftRolesRequest,
  TransferNftCreateRoleRequest,
  StopNftCreateRequest,
} from './models/requests';
import { Jwt, JwtAuthenticateGuard } from '@elrondnetwork/erdnest';

@Resolver(() => Collection)
export class CollectionsMutationsResolver extends BaseResolver(Collection) {
  constructor(
    private collectionsTransactionsService: CollectionsTransactionsService,
  ) {
    super();
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async issueNftCollection(
    @Args('input', { type: () => IssueCollectionArgs })
    input: IssueCollectionArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    const request = IssueCollectionRequest.fromArgs(input, 'issueNonFungible');
    return await this.collectionsTransactionsService.issueToken(
      address,
      request,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async issueSftCollection(
    @Args('input', { type: () => IssueCollectionArgs })
    input: IssueCollectionArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    const request = IssueCollectionRequest.fromArgs(input, 'issueSemiFungible');
    return await this.collectionsTransactionsService.issueToken(
      address,
      request,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async setRoles(
    @Args('input', { type: () => SetNftRolesArgs }) input: SetNftRolesArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    const request = SetNftRolesRequest.fromArgs(input);
    return await this.collectionsTransactionsService.setNftRoles(
      address,
      request,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async transferNftCreateRole(
    @Args('input', { type: () => TransferNftCreateRoleArgs })
    input: TransferNftCreateRoleArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    const request = TransferNftCreateRoleRequest.fromArgs(input);
    return await this.collectionsTransactionsService.transferNFTCreateRole(
      address,
      request,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async stopNftCreate(
    @Args('input', { type: () => StopNftCreateArgs }) input: StopNftCreateArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    const request = StopNftCreateRequest.fromArgs(input);
    return await this.collectionsTransactionsService.stopNFTCreate(
      address,
      request,
    );
  }
}
