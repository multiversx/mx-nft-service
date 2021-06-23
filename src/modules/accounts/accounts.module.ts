import { forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';
import { AccountsModuleDb } from '../../db/accounts/accounts.module';
import { FollowersModuleDb } from 'src/db/followers/followers.module';
import { AssetsModuleGraph } from '../assets/assets.module';
import { S3Service } from '../s3/s3-manager.service';

@Module({
  providers: [AccountsService, S3Service, AccountsResolver],
  imports: [
    ElrondCommunicationModule,
    AccountsModuleDb,
    forwardRef(() => AssetsModuleGraph),
    FollowersModuleDb,
  ],
  exports: [AccountsService],
})
export class AccountsModuleGraph {}
