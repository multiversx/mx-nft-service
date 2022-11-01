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
  ): Promise<void> {
    try {
      await this.nftScamService.validateOrUpdateNftScamInfo(identifier);
    } catch (error) {
      throw new ApolloError(error);
    }
  }
}
