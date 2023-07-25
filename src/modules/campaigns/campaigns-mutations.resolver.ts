import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import {
  IssueCampaignArgs,
  BuyRandomNftActionArgs,
  Campaign,
  UpgradeNftArgs,
} from './models';
import { NftMinterAbiService } from './nft-minter.abi.service';
import { UseGuards } from '@nestjs/common';
import { TransactionNode } from '../common/transaction';
import { BuyRequest, IssueCampaignRequest } from './models/requests';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { AuthUser } from '../auth/authUser';
import { UserAuthResult } from '../auth/userAuthResult';
import { UpgradeNftRequest } from './models/requests/UpgradeNftRequest ';

@Resolver(() => Campaign)
export class CampaignsMutationsResolver extends BaseResolver(Campaign) {
  constructor(private nftMinterService: NftMinterAbiService) {
    super();
  }

  @Mutation(() => TransactionNode)
  // @UseGuards(JwtOrNativeAuthGuard)
  async issueCampaign(
    @Args('input') input: IssueCampaignArgs,
    // @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = IssueCampaignRequest.fromArgs(input);
    return await this.nftMinterService.issueToken(
      'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
      request,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async buyRandomNft(
    @Args('input') input: BuyRandomNftActionArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = BuyRequest.fromArgs(input);
    return await this.nftMinterService.buyRandomNft(user.address, request);
  }

  @Mutation(() => TransactionNode)
  @UseGuards(JwtOrNativeAuthGuard)
  async upgradeNftRoyalties(
    @Args('input') input: UpgradeNftArgs,
    @AuthUser() user: UserAuthResult,
  ): Promise<TransactionNode> {
    const request = UpgradeNftRequest.fromArgs(input);
    return await this.nftMinterService.upgradeNft(user.address, request);
  }
}
