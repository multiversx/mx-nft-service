import { Logger, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { DocumentDbModule } from 'src/document-db/document-db.module';
import { AuthModule } from '../auth/auth.module';
import { NftScamElasticService } from './nft-scam.elastic.service';
import { NftScamResolver } from './nft-scam.resolver';
import { NftScamService } from './nft-scam.service';

@Module({
  imports: [CommonModule, DocumentDbModule, AuthModule],
  providers: [Logger, NftScamService, NftScamElasticService, NftScamResolver],
  exports: [NftScamService, NftScamElasticService],
})
export class NftScamModule {}
