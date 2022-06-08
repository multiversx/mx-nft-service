import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common';
import { SearchResolver } from './search.resolver';
import { SearchService } from './search.service';

@Module({
  providers: [SearchService, SearchResolver],
  imports: [ElrondCommunicationModule],
  exports: [SearchService],
})
export class SearchModuleGraph {}
