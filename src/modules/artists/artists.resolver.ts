import { Query, Resolver, Args } from '@nestjs/graphql';
import { Account } from '../account-stats/models';
import ConnectionArgs, { getPagingParameters } from '../common/filters/ConnectionArgs';
import PageResponse from '../common/PageResponse';
import { ArtistsService } from './artists.service';
import { ArtistFilters } from './models/Artists.Filter';
import { ArtistResponse } from './models/ArtistsResponse.dto';

@Resolver(() => ArtistResponse)
export class ArtistsResolver {
  constructor(private artistsService: ArtistsService) {}

  @Query(() => ArtistResponse)
  async artists(
    @Args({ name: 'filters', type: () => ArtistFilters })
    filters: ArtistFilters,
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ): Promise<ArtistResponse> {
    const { limit, offset } = getPagingParameters(pagination);
    const [accounts, count] = await this.artistsService.getArtists(filters, offset, limit);
    return PageResponse.mapResponse<Account>(accounts || [], pagination, count || 0, offset, limit);
  }
}
