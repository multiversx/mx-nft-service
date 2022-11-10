import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { DocumentDbModule } from 'src/document-db/document-db.module';
import { NftScamElasticService } from './nft-scam.elastic.service';
import { NftScamResolver } from './nft-scam.resolver';
import { NftScamService } from './nft-scam.service';

@Module({
  imports: [CommonModule, DocumentDbModule],
  providers: [NftScamService, NftScamElasticService, NftScamResolver],
  exports: [NftScamService, NftScamElasticService],
})
export class NftScamModule {}
