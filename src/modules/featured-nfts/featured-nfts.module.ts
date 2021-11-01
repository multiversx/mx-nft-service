import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { FeaturedNftsRepository } from 'src/db/featuredNfts';
import { FeaturedNftsResolver } from './featured-nfts.resolver';
import { FeaturedNftsService } from './featured-nfts.service';

@Module({
  providers: [RedisCacheService, FeaturedNftsService, FeaturedNftsResolver],
  imports: [
    ElrondCommunicationModule,
    TypeOrmModule.forFeature([FeaturedNftsRepository]),
  ],
  exports: [RedisCacheService],
})
export class FeaturedNftsModuleGraph {}
