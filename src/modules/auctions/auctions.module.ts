import { forwardRef, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { AuctionsService } from './auctions.service';
import { AuctionsResolver } from './auctions.resolver';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { AssetsModuleGraph } from '../assets/assets.module';
import { NftMarketplaceAbiService } from './nft-marketplace.abi.service';
import { OrdersModuleGraph } from '../orders/orders.module';

@Module({
  providers: [AuctionsService, AuctionsResolver, NftMarketplaceAbiService],
  imports: [
    ElrondCommunicationModule,
    AuctionsModuleDb,
    forwardRef(() => AccountsModuleGraph),
    forwardRef(() => AssetsModuleGraph),
    forwardRef(() => OrdersModuleGraph),
  ],
  exports: [AuctionsService, NftMarketplaceAbiService],
})
export class AuctionsModuleGraph {}
