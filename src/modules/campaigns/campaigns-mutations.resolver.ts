import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { IssueCampaignArgs, BuyRandomNftActionArgs, Campaign } from './models';
import { NftMinterAbiService } from './nft-minter.abi.service';
import { UseGuards } from '@nestjs/common';
import { TransactionNode } from '../common/transaction';
import { BuyRequest, IssueCampaignRequest } from './models/requests';
import { Jwt, JwtAuthenticateGuard } from '@elrondnetwork/erdnest';

@Resolver(() => Campaign)
export class CampaignsMutationsResolver extends BaseResolver(Campaign) {
  constructor(private nftMinterService: NftMinterAbiService) {
    super();
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async issueCampaign(
    @Args('input') input: IssueCampaignArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    const request = IssueCampaignRequest.fromArgs(input);
    return await this.nftMinterService.issueToken(address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtAuthenticateGuard)
  async buyRandomNft(
    @Args('input') input: BuyRandomNftActionArgs,
    @Jwt('address') address: string,
  ): Promise<TransactionNode> {
    const request = BuyRequest.fromArgs(input);
    return await this.nftMinterService.buyRandomNft(address, request);
  }
}
