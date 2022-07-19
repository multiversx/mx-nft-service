import { Module } from '@nestjs/common';
import { ContractInfoResolver } from './contract-info.resolver';
import { ElrondCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { NftMarketplaceAbiService } from '../auctions';

@Module({
  providers: [ContractInfoResolver, NftMarketplaceAbiService],
  imports: [CommonModule, ElrondCommunicationModule],
  exports: [NftMarketplaceAbiService],
})
export class ContractInfoModuleGraph {}
