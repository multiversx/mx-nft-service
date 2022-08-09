import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common.module';
import { AuctionsModuleGraph } from 'src/modules/auctions/auctions.module';
import { NotificationsModuleGraph } from 'src/modules/notifications/notifications.module';
import { ClaimableAuctionsService } from './claimable.auction.service';
import * as ormconfig from './../../ormconfig';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),

    CommonModule,
    AuctionsModuleGraph,
    NotificationsModuleGraph,
  ],
  providers: [ClaimableAuctionsService],
  exports: [ClaimableAuctionsService, CommonModule],
})
export class ClaimableAuctionsModule {}
