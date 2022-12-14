import { UseGuards } from '@nestjs/common';
import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { AuthUser } from '../auth/authUser';
import { UserAuthResult } from '../auth/userAuthResult';
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
  @UseGuards(JwtOrNativeAuthGuard)
  addReport(
    @Args('input', { type: () => ReportNftInput }) input: ReportNftInput,
    @AuthUser() user: UserAuthResult,
  ): Promise<boolean> {
    return this.reportNfts.addReport(input.identifier, user.address);
  }
}
