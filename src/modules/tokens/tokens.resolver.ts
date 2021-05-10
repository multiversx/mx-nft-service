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
    @Args('token_name') token_name: string,
    @Args('token_ticker') token_ticker: string,
  ): Promise<TransactionNode> {
    return await this.tokensService.issueNft(token_name, token_ticker);
  }

  @Mutation(() => TransactionNode, { name: 'setRoles' })
  async setRoles(
    @Args('token_identifier') token_identifier: string,
    @Args('address_transfer') address_transfer: string,
    @Args('role') role: string,
  ): Promise<TransactionNode> {
    return await this.tokensService.setNftRoles(
      token_identifier,
      address_transfer,
      role,
    );
  }
}
