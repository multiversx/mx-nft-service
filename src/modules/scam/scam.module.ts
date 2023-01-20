import { Logger, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { DocumentDbModule } from 'src/document-db/document-db.module';
import { AuthModule } from '../auth/auth.module';
import { CollectionScamResolver } from './collection-scam.resolver';
import { CollectionScamService } from './collection-scam.service';
import { NftScamElasticService } from './nft-scam.elastic.service';
import { NftScamResolver } from './nft-scam.resolver';
import { NftScamService } from './nft-scam.service';

@Module({
  imports: [CommonModule, DocumentDbModule, AuthModule],
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
