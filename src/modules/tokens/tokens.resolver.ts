import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../nfts/base.resolver';
import { TokenType } from '../nfts/dto/token.dto';
import { TransactionNode } from '../nfts/dto/transaction';
import { TokensService } from './tokens.service';

@Resolver()
export class TokensResolver extends BaseResolver(TokenType) {
  constructor(private tokensService: TokensService) {
    super();
  }

  @Mutation(() => TransactionNode, { name: 'issueNft' })
  async issueNft(
    @Args('tokenName') tokenName: string,
    @Args('tokenTicker') tokenTicker: string,
  ): Promise<TransactionNode> {
    return await this.tokensService.issueNft(tokenName, tokenTicker);
  }

  @Mutation(() => TransactionNode, { name: 'setRoles' })
  async setRoles(
    @Args('tokenIdentifier') tokenIdentifier: string,
    @Args('addressTransfer') addressTransfer: string,
    @Args('role') role: string,
  ): Promise<TransactionNode> {
    return await this.tokensService.setNftRoles(
      tokenIdentifier,
      addressTransfer,
      role,
    );
  }
}
