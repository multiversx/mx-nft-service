import { Resolver, Args, Mutation, Query } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { TokenType } from './models';
import { IssueTokenArgs } from './models';
import { SetNftRolesArgs } from './models/SetNftRolesArgs';
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

  @Query(() => [String])
  async getRegisteredNfts(
    @Args('ownerAddress') ownerAddress: string,
  ): Promise<string[]> {
    return await this.elrondGateway.getRegisteredNfts(ownerAddress);
  }
}
