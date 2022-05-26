import { Resolver, Args, Mutation, Int } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { IssueCampaignArgs, BuyRandomNftActionArgs, Campaign } from './models';
import { NftMinterAbiService } from './nft-minter.abi.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { TransactionNode } from '../common/transaction';
import { User } from '../auth/user';
import { BuyRequest, IssueCampaignRequest } from './models/requests';

@Resolver(() => Campaign)
export class CampaignsMutationsResolver extends BaseResolver(Campaign) {
  constructor(private nftMinterService: NftMinterAbiService) {
    super();
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async issueCampaign(
    @Args('input') input: IssueCampaignArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = IssueCampaignRequest.fromArgs(input);
    return await this.nftMinterService.issueToken(user.publicKey, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async buyRandomNft(
    @Args('input') input: BuyRandomNftActionArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = BuyRequest.fromArgs(input);
    return await this.nftMinterService.buyRandomNft(user.publicKey, request);
  }
}
