import { forwardRef, Module } from '@nestjs/common';
import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';
import { FollowersModuleDb } from 'src/db/followers/followers.module.db';
import { AssetsModuleGraph } from '../assets/assets.module';
import { AccountsProvider } from './accounts.loader';
import { ElrondCommunicationModule } from 'src/common';

@Module({
  providers: [AccountsService, AccountsResolver, AccountsProvider],
  imports: [
    ElrondCommunicationModule,
    forwardRef(() => AssetsModuleGraph),
    FollowersModuleDb,
  ],
  exports: [AccountsService, AccountsProvider],
})
export class AccountsModuleGraph {}
