import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { MxCommunicationModule } from 'src/common';
import { TagsResolver } from './tags.resolver';

@Module({
  providers: [TagsService, TagsResolver],
  imports: [MxCommunicationModule],
  exports: [TagsService],
})
export class TagsModuleGraph {}
