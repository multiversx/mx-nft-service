import { forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { AssetsService } from './assets.service';
import { AssetsResolver } from './assets.resolver';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { IpfsModule } from '../ipfs/ipfs.module';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { AssetsLikesRepository } from 'src/db/assets/assets-likes.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheModule } from 'src/common/services/redis-cache.module';
import { AssetsLikesService } from './assets-likes.service';

@Module({
  providers: [AssetsService, AssetsLikesService, AssetsResolver],
  imports: [
    ElrondCommunicationModule,
    IpfsModule,
    TypeOrmModule.forFeature([AssetsLikesRepository]),
    RedisCacheModule.register({
      host: process.env.REDIS_URL,
      port: parseInt(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      db: 3,
    }),
  ],
  exports: [AssetsService, AssetsLikesService],
})
export class AssetsModuleGraph {}
