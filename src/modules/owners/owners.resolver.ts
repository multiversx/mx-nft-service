import { OwnerResponse, OwnersFilters, Owner } from './models';
import { Query, Resolver, Args, ResolveField, Parent } from '@nestjs/graphql';
import { OwnersService } from './owners.service';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { Account } from '../account-stats/models';
import ConnectionArgs, { getPagingParameters } from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';

@Resolver(() => Owner)
export class OwnersResolver {
  constructor(private ownersService: OwnersService, private accountsProvider: AccountsProvider) {}

  @Query(() => OwnerResponse)
  async owners(
    @Args('filters', { type: () => OwnersFilters })
    filters: OwnersFilters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<OwnerResponse> {
    const { limit, offset } = getPagingParameters(pagination);
    const [owners, count] = await this.ownersService.getOwnersForIdentifier(filters?.identifier, offset, limit);
    return PageResponse.mapResponse<Owner>(owners || [], pagination, count || 0, offset, limit);
  }

  @ResolveField(() => Account)
  async account(@Parent() owner: Owner) {
    const { address } = owner;

    if (!address) return null;
    const account = await this.accountsProvider.load(address);
    return Account.fromEntity(account?.value, address);
  }
}
