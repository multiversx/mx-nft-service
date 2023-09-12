import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { CollectionScamService } from './collection-scam.service';
import { UseGuards } from '@nestjs/common';
import { GqlAdminAuthGuard } from '../auth/gql-admin.auth-guard';
import { JwtOrNativeAuthGuard } from '../auth/jwt.or.native.auth-guard';
import { GraphQLError } from 'graphql';

@Resolver(() => Boolean)
export class CollectionScamResolver {
  constructor(private readonly collectionScamService: CollectionScamService) {}

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async setCollectionScamInfo(@Args('collection') collection: string): Promise<boolean> {
    try {
      return await this.collectionScamService.manuallySetCollectionScamInfo(collection);
    } catch (error) {
      throw new GraphQLError(error);
    }
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtOrNativeAuthGuard, GqlAdminAuthGuard)
  async clearCollectionScamInfo(@Args('collection') collection: string): Promise<boolean> {
    try {
      return await this.collectionScamService.manuallyClearCollectionScamInfo(collection);
    } catch (error) {
      throw new GraphQLError(error);
    }
  }
}
