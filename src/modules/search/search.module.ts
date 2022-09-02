import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { CollectionModuleGraph } from '../nftCollections/collection.module';
import { SearchResolver } from './search.resolver';
import { SearchService } from './search.service';

@Module({
  providers: [SearchService, SearchResolver],
  imports: [ElrondCommunicationModule, CollectionModuleGraph],
  exports: [SearchService],
})
export class SearchModuleGraph {}
