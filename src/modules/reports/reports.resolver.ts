import { UseGuards } from '@nestjs/common';
import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { AuthUser } from '../auth/authUser';
import { UserAuthResult } from '../auth/userAuthResult';
import { BaseResolver } from '../common/base.resolver';
import { ReportNft } from './report-nft.dto';
import { ReportCollectionInput, ReportNftInput } from './reports.input';
import { ReportsService } from './reports.service';

@Resolver(() => ReportNft)
export class ReportsResolver extends BaseResolver(ReportNft) {
  constructor(private reportNfts: ReportsService) {
    super();
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard)
  addReport(
    @Args('input', {
      type: () => ReportNftInput,
      description: 'This endpoint can be used to report a NFT',
    })
    input: ReportNftInput,
    @AuthUser() user: UserAuthResult,
  ): Promise<boolean> {
    return this.reportNfts.addNftReport(input.identifier, user.address);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard)
  reportCollection(
    @Args('input', {
      type: () => ReportCollectionInput,
      description: 'This endpoint can be used to report a Collection',
    })
    input: ReportCollectionInput,
    @AuthUser() user: UserAuthResult,
  ): Promise<boolean> {
    return this.reportNfts.addCollectionReport(input.collectionIdentifier, user.address);
  }
}
