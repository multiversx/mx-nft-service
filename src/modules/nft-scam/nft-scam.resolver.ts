import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NftScamService } from './nft-scam.service';
import { ApolloError } from 'apollo-server-express';
import { ScamInfoTypeEnum } from '../assets/models';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';

@Resolver(() => Boolean)
export class NftScamResolver {
  constructor(private readonly nftScamService: NftScamService) {}

  @Mutation(() => Boolean)
  @UseGuards(GqlAdminAuthGuard)
  async validateOrUpdateNftScamInfo(
    @Args('identifier') identifier: string,
  ): Promise<boolean> {
    try {
      return await this.nftScamService.validateOrUpdateNftScamInfo(identifier);
    } catch (error) {
      throw new ApolloError(error);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAdminAuthGuard)
  async setNftScamInfo(
    @Args('identifier') identifier: string,
    @Args({ name: 'type', type: () => ScamInfoTypeEnum })
    type: ScamInfoTypeEnum,
    @Args('info') info: string,
  ): Promise<boolean> {
    try {
      return await this.nftScamService.manuallySetNftScamInfo(
        identifier,
        type,
        info,
      );
    } catch (error) {
      throw new ApolloError(error);
    }
  }
}
