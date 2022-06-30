import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { FlagNftService } from './flag-nft.service';
import { FlagNftInput } from './models/flag-nft.input';

@Resolver(() => Boolean)
export class AdminOperationsResolver {
  constructor(private flagService: FlagNftService) {}

  @Mutation(() => Boolean)
  @UseGuards(GqlAdminAuthGuard)
  flagNft(
    @Args('input', { type: () => FlagNftInput }) input: FlagNftInput,
  ): Promise<boolean> {
    return this.flagService.updateNftNSFWByAdmin(
      input.identifier,
      input.nsfwFlag,
    );
  }
}
