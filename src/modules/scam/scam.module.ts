import { Logger, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { DocumentDbModule } from 'src/document-db/document-db.module';
import { AuthModule } from '../auth/auth.module';
import { NftScamElasticService } from './nft-scam.elastic.service';
import { ScamResolver } from './scam.resolver';
import { NftScamService } from './nft-scam.service';
import { CollectionScamService } from './collection.scam.service';
import { FeaturedCollectionsCachingService } from '../featured/featured-caching.service';
import { CollectionScamElasticService } from './collection-scam.elastic.service';

@Module({
  imports: [CommonModule, DocumentDbModule, AuthModule],
  providers: [
    Logger,
    NftScamService,
    NftScamElasticService,
    CollectionScamService,
    CollectionScamElasticService,
    FeaturedCollectionsCachingService,
    ScamResolver,
  ],
  exports: [NftScamService, NftScamElasticService],
})
export class ScamModule {}
