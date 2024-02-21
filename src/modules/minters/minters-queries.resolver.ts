import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { Minter } from './models';
import { UseGuards } from '@nestjs/common';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { MintersService } from './minters.service';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { MinterFilters } from './models/MinterFilters';
import ConnectionArgs, { getPagingParameters } from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { MintersResponse } from './models/MintersResponse';

@Resolver(() => MintersResponse)
export class MintersQueriesResolver extends BaseResolver(MintersResponse) {
  constructor(private minterService: MintersService) {
    super();
  }

  @Mutation(() => MintersResponse)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async minters(
    @Args('filters') filters: MinterFilters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<MintersResponse> {
    const { limit, offset } = getPagingParameters(pagination);
    const minters = await this.minterService.getMinters(filters);
    return PageResponse.mapResponse<Minter>(minters || [], pagination, minters?.length || 0, offset, limit);
  }
}
