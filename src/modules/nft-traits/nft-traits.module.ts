import { Logger, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { NftTraitsService } from './nft-traits.service';
import { DocumentDbModule } from 'src/document-db/document-db.module';
import { NftTraitsElasticService } from './nft-traits.elastic.service';

@Module({
  imports: [MxCommunicationModule, CommonModule, DocumentDbModule],
  providers: [Logger, NftTraitsService, NftTraitsElasticService],
  exports: [NftTraitsService, NftTraitsElasticService],
})
export class NftTraitsModule {}
