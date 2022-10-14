import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { CollectionsModuleGraph } from 'src/modules/nftCollections/collections.module';
import { NftTraitsService } from './nft-traits.service';
import { PersistenceModule } from 'src/common/persistence/persistence.module';

@Module({
  imports: [
    CollectionsModuleGraph,
    ElrondCommunicationModule,
    CommonModule,
    PersistenceModule,
  ],
  providers: [NftTraitsService],
  exports: [NftTraitsService],
})
export class NftTraitsModule {}
