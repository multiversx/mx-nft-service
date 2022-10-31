import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { PersistenceModule } from 'src/common/persistence/persistence.module';
import { NftScamResolver } from './nft-scam.resolver';
import { NftScamService } from './nft-scam.service';

@Module({
  imports: [CommonModule, PersistenceModule],
  providers: [NftScamService, NftScamResolver],
  exports: [NftScamService],
})
export class NftScamModule {}
