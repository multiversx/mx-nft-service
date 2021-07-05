import { forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { AssetsService } from './assets.service';
import { AssetsResolver } from './assets.resolver';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { IpfsModule } from '../ipfs/ipfs.module';
import { AssetsLikesRepository } from 'src/db/assets/assets-likes.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsLikesService } from './assets-likes.service';
import { RedisCacheService } from 'src/common/services/redis-cache.service';

@Module({
  providers: [
    AssetsService,
    AssetsLikesService,
    AssetsResolver,
    RedisCacheService,
  ],
  imports: [
    ElrondCommunicationModule,
    IpfsModule,
    TypeOrmModule.forFeature([AssetsLikesRepository]),
  ],
  exports: [AssetsService, AssetsLikesService, RedisCacheService],
})
export class AssetsModuleGraph {}
