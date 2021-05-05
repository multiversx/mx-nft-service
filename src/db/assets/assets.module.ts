import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from './asset.entity';
import { AssetsService } from './assets.service';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity])],
  providers: [AssetsService],
})
export class AssetsModule {}
