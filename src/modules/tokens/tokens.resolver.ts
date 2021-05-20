import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../base.resolver';
import { TokenType } from './models';
import { IssueTokenArgs } from './models';
import { SetNftRolesArgs } from './models/SetNftRolesArgs';
import { TokensService } from './tokens.service';
import { TransactionNode } from '../transaction';

@Resolver()
export class TokensResolver extends BaseResolver(TokenType) {
  constructor(private tokensService: TokensService) {
    super();
  }

  @Mutation(() => TransactionNode, { name: 'issueNft' })
  async issueNft(
    @Args('input') input: IssueTokenArgs,
  ): Promise<TransactionNode> {
    return await this.tokensService.issueNft(input);
  }

  @Mutation(() => TransactionNode, { name: 'setRoles' })
  async setRoles(
    @Args('input') input: SetNftRolesArgs,
  ): Promise<TransactionNode> {
    return await this.tokensService.setNftRoles(input);
  }
}
