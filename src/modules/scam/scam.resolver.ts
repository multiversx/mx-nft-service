import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NftScamService } from './nft-scam.service';
import { ApolloError } from 'apollo-server-express';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { ScamInfoTypeEnum } from '../assets/models';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { CollectionScamService } from './collection.scam.service';

@Resolver(() => Boolean)
export class ScamResolver {
  constructor(
    private readonly nftScamService: NftScamService,
    private readonly collectionScamService: CollectionScamService,
  ) {}

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
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
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async setNftScamInfo(
    @Args('identifier') identifier: string,
    @Args({ name: 'type', type: () => ScamInfoTypeEnum })
    type: ScamInfoTypeEnum,
    @Args('info', { nullable: true }) info: string = '',
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

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async clearNftScamInfo(
    @Args('identifier') identifier: string,
  ): Promise<boolean> {
    try {
      return await this.nftScamService.manuallyClearNftScamInfo(identifier);
    } catch (error) {
      throw new ApolloError(error);
    }
  }

  @Mutation(() => Boolean)
  //@UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async setCollectionScamInfo(
    @Args('collection') collection: string,
    @Args({ name: 'type', type: () => ScamInfoTypeEnum })
    type: ScamInfoTypeEnum,
    @Args('info', { nullable: true }) info: string = '',
  ): Promise<boolean> {
    try {
      return await this.collectionScamService.manuallySetCollectionScamInfo(
        collection,
        type,
        info,
      );
    } catch (error) {
      throw new ApolloError(error);
    }
  }

  @Mutation(() => Boolean)
  //@UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async clearcollectionScamInfo(
    @Args('collection') collection: string,
  ): Promise<boolean> {
    try {
      return await this.collectionScamService.manuallyClearCollectionScamInfo(
        collection,
      );
    } catch (error) {
      throw new ApolloError(error);
    }
  }
}
