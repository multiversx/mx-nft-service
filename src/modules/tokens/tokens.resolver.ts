import { Resolver, Query, Args } from '@nestjs/graphql';
import { BaseResolver } from '../nfts/base.resolver';
import { Order } from '../nfts/dto/order.dto';
import { TokenType } from '../nfts/dto/token.dto';
import { TransactionNode } from '../nfts/dto/transaction';
import { TokensService } from './tokens.service';

@Resolver()
export class TokensResolver extends BaseResolver(TokenType) {
  constructor(private tokensService: TokensService) {
    super();
  }

  @Query((returns) => TransactionNode)
  async issueNft(
    @Args('token_name') token_name: string,
    @Args('token_ticker') token_ticker: string,
  ): Promise<TransactionNode> {
    return await this.tokensService.issueNft(token_name, token_ticker);
  }

  @Query((returns) => TransactionNode)
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

  @Query((returns) => [TokenType])
  async fetchTokenIdentifiersForUser(
    @Args('address') address: string,
  ): Promise<[TokenType]> {
    return await this.tokensService.fetchTokenIdentifiers(address);
  }
}
