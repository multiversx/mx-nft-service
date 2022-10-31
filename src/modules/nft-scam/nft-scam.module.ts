import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { NftScamElasticService } from './nft-scam.elastic.service';
import { NftScamResolver } from './nft-scam.resolver';
import { NftScamService } from './nft-scam.service';

@Module({
  imports: [CommonModule, PersistenceModule],
  providers: [NftScamService, NftScamElasticService, NftScamResolver],
  exports: [NftScamService, NftScamElasticService],
})
export class NftScamModule {}
