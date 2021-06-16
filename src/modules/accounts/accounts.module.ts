import { forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';
import { AccountsModuleDb } from '../../db/accounts/accounts.module';
import { FollowersModuleDb } from 'src/db/followers/followers.module';
import { AssetsModuleGraph } from '../assets/assets.module';

@Module({
  providers: [AccountsService, AccountsResolver],
  imports: [
    ElrondCommunicationModule,
    AccountsModuleDb,
    forwardRef(() => AssetsModuleGraph),
    FollowersModuleDb,
  ],
  exports: [AccountsService],
})
export class AccountsModuleGraph {}
