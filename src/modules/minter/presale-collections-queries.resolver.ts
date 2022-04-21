import { Resolver, Query, Args } from '@nestjs/graphql';
import { BaseResolver } from '../common/base.resolver';
import { PresaleCollection, PresaleCollectionsResponse } from './models';
import { NftMinterAbiService } from './nft-minter.abi.service';
import ConnectionArgs from '../common/filters/ConnectionArgs';

@Resolver(() => PresaleCollection)
export class PresaleCollectionsQueriesResolver extends BaseResolver(
  PresaleCollection,
) {
  constructor(private nftMinterService: NftMinterAbiService) {
    super();
  }

  @Query(() => PresaleCollectionsResponse)
  async presaleCollections(
    @Args({ name: 'pagination', type: () => ConnectionArgs, nullable: true })
    pagination: ConnectionArgs,
  ) {
    const { limit, offset } = pagination.pagingParams();

    return;
  }
}
