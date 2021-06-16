import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { TokensResolver } from './tokens.resolver';
import { TokensService } from './tokens.service';
import { AssetsModuleGraph } from '../assets/assets.module';

@Module({
  providers: [TokensService, TokensResolver],
  imports: [ElrondCommunicationModule, AssetsModuleGraph],
  exports: [TokensService],
})
export class TokensModuleGraph {}
