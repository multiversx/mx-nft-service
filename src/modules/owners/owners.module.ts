import { forwardRef, Module } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { AssetsModuleGraph } from '../assets/assets.module';
import { ElrondCommunicationModule } from 'src/common';
import { OwnersResolver } from './owners.resolver';
import { AccountsProvider } from '../account-stats/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/accounts.redis-handler';

@Module({
  providers: [
    OwnersService,
    OwnersResolver,
    AccountsRedisHandler,
    AccountsProvider,
  ],
  imports: [ElrondCommunicationModule, forwardRef(() => AssetsModuleGraph)],
  exports: [OwnersService, AccountsRedisHandler, AccountsProvider],
})
export class OwnersModuleGraph {}
