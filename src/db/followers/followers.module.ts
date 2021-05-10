import { Module } from '@nestjs/common';
import { FollowersServiceDb } from './followers.service';
import { FollowerEntity } from './follower.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([FollowerEntity])],
  providers: [FollowersServiceDb],
  exports: [FollowersServiceDb]
})
export class FollowersModuleDb { }
