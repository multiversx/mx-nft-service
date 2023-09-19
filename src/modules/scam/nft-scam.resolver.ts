import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NftScamService } from './nft-scam.service';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { ScamInfoTypeEnum } from '../assets/models';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { GraphQLError } from 'graphql';

@Resolver(() => Boolean)
export class NftScamResolver {
  constructor(private readonly nftScamService: NftScamService) {}

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async validateOrUpdateNftScamInfo(@Args('identifier') identifier: string): Promise<boolean> {
    try {
      return await this.nftScamService.validateNftScamInfoForIdentifier(identifier);
    } catch (error) {
      throw new GraphQLError(error);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async setNftScamInfo(
    @Args('identifier') identifier: string,
    @Args({ name: 'type', type: () => ScamInfoTypeEnum })
    type: ScamInfoTypeEnum,
    @Args('info') info: string,
  ): Promise<boolean> {
    try {
      return await this.nftScamService.manuallySetNftScamInfo(identifier, type, info);
    } catch (error) {
      throw new GraphQLError(error);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async clearNftScamInfo(@Args('identifier') identifier: string): Promise<boolean> {
    try {
      return await this.nftScamService.manuallyClearNftScamInfo(identifier);
    } catch (error) {
      throw error;
    }
  }
}
