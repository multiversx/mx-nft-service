import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { ElrondCommunicationModule } from 'src/common';
import { TagsResolver } from './tags.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsRepository } from 'src/db/auctions/tags.repository';

@Module({
  providers: [TagsService, TagsResolver],
  imports: [
    ElrondCommunicationModule,
    TypeOrmModule.forFeature([TagsRepository]),
  ],
  exports: [TagsService],
})
export class TagsModuleGraph {}
