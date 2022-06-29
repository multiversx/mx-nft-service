import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftsFlagsRepository } from 'src/db/nftFlags';
import { ElasticUpdaterService } from './elastic.updater.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([NftsFlagsRepository]),
  ],
  providers: [ElasticUpdaterService],
})
export class ElasticUpdaterModule {}
