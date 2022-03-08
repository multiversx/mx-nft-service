import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import {
  FeaturedCollectionsRepository,
  FeaturedNftsRepository,
} from 'src/db/featuredNfts';
import { FeaturedCollectionsResolver } from './featured-collections.resolver';
import { FeaturedNftsResolver } from './featured-nfts.resolver';
import { FeaturedService } from './featured.service';

@Module({
  providers: [
    RedisCacheService,
    FeaturedService,
    FeaturedNftsResolver,
    FeaturedCollectionsResolver,
  ],
  imports: [
    ElrondCommunicationModule,
    TypeOrmModule.forFeature([FeaturedNftsRepository]),
    TypeOrmModule.forFeature([FeaturedCollectionsRepository]),
  ],
  exports: [RedisCacheService],
})
export class FeaturedModuleGraph {}
