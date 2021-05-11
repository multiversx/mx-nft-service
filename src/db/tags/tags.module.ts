import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagEntity } from './tag.entity';
import { TagsServiceDb } from './tags.service';

@Module({
  imports: [TypeOrmModule.forFeature([TagEntity])],
  providers: [TagsServiceDb],
  exports: [TagsServiceDb],
})
export class TagsModuleDb {}
