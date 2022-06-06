import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { ElrondCommunicationModule } from 'src/common';
import { TagsResolver } from './tags.resolver';

@Module({
  providers: [TagsService, TagsResolver],
  imports: [ElrondCommunicationModule],
  exports: [TagsService],
})
export class TagsModuleGraph {}
