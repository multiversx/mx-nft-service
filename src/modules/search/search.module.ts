import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { CollectionsModuleGraph } from '../nftCollections/collections.module';
import { SearchResolver } from './search.resolver';
import { SearchService } from './search.service';

@Module({
  providers: [SearchService, SearchResolver],
  imports: [ElrondCommunicationModule, CollectionsModuleGraph],
  exports: [SearchService],
})
export class SearchModuleGraph {}
