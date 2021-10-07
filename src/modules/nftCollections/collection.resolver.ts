import { Resolver, Args, Mutation, Query } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import {
  StopNftCreateArgs,
  Collection,
  TransferNftCreateRoleArgs,
} from './models';
import { IssueCollectionArgs } from './models';
import { SetNftRolesArgs } from './models';
import { TransactionNode } from '../transaction';
import { ElrondProxyService } from 'src/common/services/elrond-communication/elrond-proxy.service';
import { CollectionsService } from './collection.service';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { UseGuards } from '@nestjs/common';

@Resolver()
export class CollectionsResolver extends BaseResolver(Collection) {
  constructor(
    private collectionsService: CollectionsService,
    private elrondGateway: ElrondProxyService,
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

  @Query(() => [String])
  async collections(
    @Args('ownerAddress') ownerAddress: string,
  ): Promise<string[]> {
    return await this.elrondGateway.getCollections(ownerAddress);
  }
}
