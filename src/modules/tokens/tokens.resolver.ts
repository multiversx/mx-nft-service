import { Resolver, Args, Mutation, Query } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import {
  StopNftCreateArgs,
  TokenType,
  TransferNftCreateRoleArgs,
} from './models';
import { IssueTokenArgs } from './models';
import { SetNftRolesArgs } from './models';
import { TokensService } from './tokens.service';
import { TransactionNode } from '../transaction';
import { ElrondProxyService } from 'src/common/services/elrond-communication/elrond-proxy.service';

@Resolver()
export class TokensResolver extends BaseResolver(TokenType) {
  constructor(
    private tokensService: TokensService,
    private elrondGateway: ElrondProxyService,
  ) {
    super();
  }

  @Mutation(() => TransactionNode)
  async issueNft(
    @Args('input') input: IssueTokenArgs,
  ): Promise<TransactionNode> {
    return await this.tokensService.issueNft(input);
  }

  @Mutation(() => TransactionNode)
  async issueSemiFungible(
    @Args('input') input: IssueTokenArgs,
  ): Promise<TransactionNode> {
    return await this.tokensService.issueSemiFungible(input);
  }

  @Mutation(() => TransactionNode)
  async setRoles(
    @Args('input') input: SetNftRolesArgs,
  ): Promise<TransactionNode> {
    return await this.tokensService.setNftRoles(input);
  }

  @Mutation(() => TransactionNode)
  async transferNFTCreateRole(
    @Args('input') input: TransferNftCreateRoleArgs,
  ): Promise<TransactionNode> {
    return await this.tokensService.transferNFTCreateRole(input);
  }

  @Mutation(() => TransactionNode)
  async stopNFTCreate(
    @Args('input') input: StopNftCreateArgs,
  ): Promise<TransactionNode> {
    return await this.tokensService.stopNFTCreate(input);
  }

  @Query(() => [String])
  async registeredNfts(
    @Args('ownerAddress') ownerAddress: string,
  ): Promise<string[]> {
    return await this.elrondGateway.getRegisteredNfts(ownerAddress);
  }
}
