import { forwardRef, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { AuctionsModuleGraph } from 'src/modules/auctions/auctions.module';
import { ClaimableAuctionsService } from './claimable.auction.service';

@Module({
  imports: [CommonModule, forwardRef(() => AuctionsModuleGraph)],
  providers: [ClaimableAuctionsService],
  exports: [ClaimableAuctionsService, CommonModule],
})
export class ClaimableAuctionsModule {}
