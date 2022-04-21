import { Resolver, Args, Mutation, Int } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import {
  IssuePresaleCollectionArgs,
  BuyRandomNftActionArgs,
  PresaleCollection,
} from './models';
import { NftMinterAbiService } from './nft-minter.abi.service';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { TransactionNode } from '../common/transaction';
import { User } from '../auth/user';
import { BuyRequest, IssuePresaleCollectionRequest } from './models/requests';

@Resolver(() => PresaleCollection)
export class PresaleCollectionMutationsResolver extends BaseResolver(
  PresaleCollection,
) {
  constructor(private nftMinterService: NftMinterAbiService) {
    super();
  }

  @Mutation(() => TransactionNode)
  // @UseGuards(GqlAuthGuard)
  async issuePresaleCollection(
    @Args('input') input: IssuePresaleCollectionArgs,
    // @User() user: any,
  ): Promise<TransactionNode> {
    const request = IssuePresaleCollectionRequest.fromArgs(input);
    return await this.nftMinterService.issueToken(
      'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
      request,
    );
  }

  @Mutation(() => TransactionNode)
  @UseGuards(GqlAuthGuard)
  async buyRandomNft(
    @Args('input') input: BuyRandomNftActionArgs,
    @User() user: any,
  ): Promise<TransactionNode> {
    const request = BuyRequest.fromArgs(input);
    return await this.nftMinterService.buyRandomNft(
      'erd1dc3yzxxeq69wvf583gw0h67td226gu2ahpk3k50qdgzzym8npltq7ndgha',
      request,
    );
  }
}
