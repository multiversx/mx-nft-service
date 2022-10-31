import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql.auth-guard';
import { NftScamService } from './nft-scam.service';
import { ApolloError } from 'apollo-server-express';

@Resolver(() => Boolean)
export class NftScamResolver {
  constructor(private readonly nftScamService: NftScamService) {}

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async validateOrUpdateNftScamInfo(
    @Args('identifier') identifier: string,
  ): Promise<boolean> {
    try {
      return await this.nftScamService.validateOrUpdateNftScamInfo(identifier);
    } catch (error) {
      throw new ApolloError(error);
    }
  }
}
