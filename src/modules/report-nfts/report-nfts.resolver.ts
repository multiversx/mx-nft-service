import { UseGuards } from '@nestjs/common';
import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { User } from '../auth/user';
import { BaseResolver } from '../common/base.resolver';
import { ReportNft } from './report-nft.dto';
import { ReportNftInput } from './report-nft.input';
import { ReportNftsService } from './report-nfts.service';

@Resolver(() => ReportNft)
export class ReportNftsResolver extends BaseResolver(ReportNft) {
  constructor(private reportNfts: ReportNftsService) {
    super();
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  addReport(
    @Args('input') input: ReportNftInput,
    @User() user: any,
  ): Promise<boolean> {
    return this.reportNfts.addReport(input.identifier, user.publicKey);
  }
}
