import { forwardRef, Module } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { FollowersModuleDb } from 'src/db/followers/followers.module.db';
import { AssetsModuleGraph } from '../assets/assets.module';
import { ElrondCommunicationModule } from 'src/common';
import { OwnersResolver } from './owners.resolver';
import { AccountsProvider } from '../accounts/accounts.loader';
import { AccountsRedisHandler } from '../accounts/accounts.redis-handler';

@Module({
  providers: [
    OwnersService,
    OwnersResolver,
    AccountsRedisHandler,
    AccountsProvider,
  ],
  imports: [
    ElrondCommunicationModule,
    forwardRef(() => AssetsModuleGraph),
    FollowersModuleDb,
  ],
  exports: [OwnersService, AccountsRedisHandler, AccountsProvider],
})
export class OwnersModuleGraph {}
