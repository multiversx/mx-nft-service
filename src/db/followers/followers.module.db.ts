import { Module } from '@nestjs/common';
import { FollowerEntity, FollowersServiceDb } from '.';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([FollowerEntity])],
  providers: [FollowersServiceDb],
  exports: [FollowersServiceDb],
})
export class FollowersModuleDb {}
