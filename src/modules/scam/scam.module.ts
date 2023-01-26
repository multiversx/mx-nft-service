import { Logger, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { DocumentDbModule } from 'src/document-db/document-db.module';
import { AuthModule } from '../auth/auth.module';
import { CacheInvalidationEventsModule } from '../rabbitmq/cache-invalidation/cache-invalidation-module/cache-invalidation-events.module';
import { CollectionScamResolver } from './collection-scam.resolver';
import { CollectionScamService } from './collection-scam.service';
import { NftScamElasticService } from './nft-scam.elastic.service';
import { NftScamResolver } from './nft-scam.resolver';
import { NftScamService } from './nft-scam.service';

@Module({
  imports: [
    CommonModule,
    DocumentDbModule,
    AuthModule,
    CacheInvalidationEventsModule,
  ],
  providers: [
    Logger,
    NftScamService,
    NftScamElasticService,
    NftScamResolver,
    CollectionScamService,
    CollectionScamResolver,
  ],
  exports: [NftScamService, NftScamElasticService],
})
export class ScamModule {}
