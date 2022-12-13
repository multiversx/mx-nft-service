import { Jwt, JwtAuthenticateGuard } from '@elrondnetwork/erdnest';
import { UseGuards } from '@nestjs/common';
import { Resolver, Args, Mutation } from '@nestjs/graphql';
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
  @UseGuards(JwtAuthenticateGuard)
  addReport(
    @Args('input', { type: () => ReportNftInput }) input: ReportNftInput,
    @Jwt('address') address: string,
  ): Promise<boolean> {
    return this.reportNfts.addReport(input.identifier, address);
  }
}
