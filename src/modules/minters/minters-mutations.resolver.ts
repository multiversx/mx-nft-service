import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { WhitelistMinterArgs, Minter } from './models';
import { UseGuards } from '@nestjs/common';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { MintersService } from './minters.service';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';

@Resolver(() => Minter)
export class MintersMutationsResolver extends BaseResolver(Minter) {
  constructor(private minterService: MintersService) {
    super();
  }

  @Mutation(() => Minter)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async whitelistMinter(
    @Args('input') input: WhitelistMinterArgs,
  ): Promise<Minter> {
    return await this.minterService.whitelistMinter(
      input.address,
      input.name,
      input.description,
    );
  }
}
