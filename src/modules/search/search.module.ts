import { Logger, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { CollectionsModuleGraph } from '../nftCollections/collections.module';
import { SearchResolver } from './search.resolver';
import { SearchService } from './search.service';

@Module({
  providers: [Logger, SearchService, SearchResolver],
  imports: [MxCommunicationModule, CollectionsModuleGraph],
  exports: [SearchService],
})
export class SearchModuleGraph {}
