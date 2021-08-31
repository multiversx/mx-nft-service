import { forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';
import { FollowersModuleDb } from 'src/db/followers/followers.module';
import { AssetsModuleGraph } from '../assets/assets.module';
import { AccountsProvider } from './accounts.loader';

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
