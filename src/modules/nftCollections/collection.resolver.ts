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

@Resolver()
export class CollectionsResolver extends BaseResolver(Collection) {
  constructor(
    private collectionsService: CollectionsService,
    private elrondGateway: ElrondProxyService,
  ) {
    super();
  }

  @Mutation(() => TransactionNode)
  async issueNft(
    @Args('input') input: IssueCollectionArgs,
  ): Promise<TransactionNode> {
    return await this.collectionsService.issueNft(input);
  }

  @Mutation(() => TransactionNode)
  async issueSemiFungible(
    @Args('input') input: IssueCollectionArgs,
  ): Promise<TransactionNode> {
    return await this.collectionsService.issueSemiFungible(input);
  }

  @Mutation(() => TransactionNode)
  async setRoles(
    @Args('input') input: SetNftRolesArgs,
  ): Promise<TransactionNode> {
    return await this.collectionsService.setNftRoles(input);
  }

  @Mutation(() => TransactionNode)
  async transferNFTCreateRole(
    @Args('input') input: TransferNftCreateRoleArgs,
  ): Promise<TransactionNode> {
    return await this.collectionsService.transferNFTCreateRole(input);
  }

  @Mutation(() => TransactionNode)
  async stopNFTCreate(
    @Args('input') input: StopNftCreateArgs,
  ): Promise<TransactionNode> {
    return await this.collectionsService.stopNFTCreate(input);
  }

  @Query(() => [String])
  async registeredNfts(
    @Args('ownerAddress') ownerAddress: string,
  ): Promise<string[]> {
    return await this.elrondGateway.getRegisteredNfts(ownerAddress);
  }
}
