import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from './asset.entity';
import { AssetsServiceDb } from './assets.service';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity])],
  providers: [AssetsServiceDb],
  exports: [AssetsServiceDb],
})
export class AssetsModuleDb {}
