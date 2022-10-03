import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { CollectionsModuleGraph } from 'src/modules/nftCollections/collections.module';
import { NftTraitsService } from './nft-traits.service';

@Module({
  imports: [CollectionsModuleGraph, ElrondCommunicationModule, CommonModule],
  providers: [NftTraitsService],
  exports: [NftTraitsService],
})
export class NftTraitsModule {}
