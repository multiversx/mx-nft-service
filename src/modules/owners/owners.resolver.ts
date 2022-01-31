import { OwnerResponse, OwnersFilters, Owner } from './models';
import {
  Mutation,
  Query,
  Resolver,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { OwnersService } from './owners.service';
import ConnectionArgs from '../ConnectionArgs';
import PageResponse from '../PageResponse';
import { AccountsProvider } from '../accounts/accounts.loader';
import { Account } from '../accounts/models';

@Resolver(() => Owner)
export class OwnersResolver {
  constructor(
    private ownersService: OwnersService,
    private accountsProvider: AccountsProvider,
  ) {}

  @Query(() => OwnerResponse)
  async owners(
    @Args({ name: 'filters', type: () => OwnersFilters })
    filters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<OwnerResponse> {
    if (process.env.NODE_ENV === 'production') {
      return new OwnerResponse();
    }
    const { limit, offset } = pagination.pagingParams();
    const [owners, count] = await this.ownersService.getOwnersForIdentifier(
      filters?.identifier,
      offset,
      limit,
    );
    return PageResponse.mapResponse<Owner>(
      owners || [],
      pagination,
      count,
      offset,
      limit,
    );
  }

  @ResolveField(() => Account)
  async account(@Parent() owner: Owner) {
    const { address } = owner;

    if (!address) return null;
    const account = await this.accountsProvider.load(address);
    return Account.fromEntity(account, address);
  }
}
