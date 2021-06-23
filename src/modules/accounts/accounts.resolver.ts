import { Account } from './models';
import {
  Mutation,
  Query,
  Resolver,
  Args,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { AccountsService } from './accounts.service';
import { AssetsService } from '../assets/assets.service';
import { UpsertAccountArgs } from './models/UpsertAccountArgs';
import { Asset } from '../assets/models';
import { FiltersExpression } from '../filtersTypes';
import { connectionFromArraySlice } from 'graphql-relay';
import ConnectionArgs from '../ConnectionArgs';
import { Auction } from '../auctions/models';
import { IGraphQLContext } from 'src/db/auctions/graphql.types';
import { GraphQLUpload } from 'apollo-server-express';
import { FileUpload } from 'graphql-upload';
import AccountResponse from './AccountResponse';
import { SocialLink } from '../socialLinks/models';

@Resolver(() => Account)
export class AccountsResolver {
  constructor(
    private accountsService: AccountsService,
    private assetsService: AssetsService,
  ) {}

  @Mutation(() => Account)
  async upsertAccount(
    @Args('input') input: UpsertAccountArgs,
    @Args({ name: 'coverImage', type: () => GraphQLUpload, nullable: true })
    coverImage: FileUpload,
    @Args({ name: 'avatarFile', type: () => GraphQLUpload, nullable: true })
    avatarFile: FileUpload,
  ): Promise<void> {
    input.coverFile = coverImage;
    input.avatarFile = avatarFile;
    return this.accountsService.upsertAccount(input);
  }

  @Query(() => AccountResponse)
  async accounts(
    @Args({ name: 'filters', type: () => FiltersExpression, nullable: true })
    filters,
    @Args() args: ConnectionArgs,
  ): Promise<AccountResponse> {
    const { limit, offset } = args.pagingParams();
    const [accounts, count] = await this.accountsService.getAccounts(
      limit,
      offset,
      filters,
    );
    const page = connectionFromArraySlice(accounts, args, {
      arrayLength: count,
      sliceStart: offset || 0,
    });
    return {
      edges: page.edges,
      pageInfo: page.pageInfo,
      pageData: { count, limit, offset },
    };
  }

  @ResolveField('assets', () => [Asset])
  async assets(@Parent() account: Account): Promise<Asset[]> {
    const [assets, count] = await this.assetsService.getAssetsForUser(
      account.address,
    );
    return assets;
  }

  @ResolveField('auctions', () => [Auction])
  async auctions(
    @Parent() account: Account,
    @Context()
    { acountAuctionLoader: acountAuctionLoader }: IGraphQLContext,
  ) {
    const { address } = account;
    return acountAuctionLoader.load(address);
  }

  @ResolveField('followers', () => [Account])
  async followers(@Parent() account: Account): Promise<Account[]> {
    return await this.accountsService.getFollowers(account.id);
  }

  @ResolveField('following', () => [Account])
  async following(@Parent() account: Account): Promise<Account[]> {
    return await this.accountsService.getFollowing(account.id);
  }

  @ResolveField('socialLinks', () => [SocialLink])
  async socialLinks(@Parent() account: Account): Promise<SocialLink[]> {
    const socialLinks = await this.accountsService.getSocialLinks(account.id);
    return socialLinks.map((element) => SocialLink.fromEntity(element));
  }
}
