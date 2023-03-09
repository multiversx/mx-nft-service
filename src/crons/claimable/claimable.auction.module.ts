import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common.module';
import { AuctionsModuleGraph } from 'src/modules/auctions/auctions.module';
import { NotificationsModuleGraph } from 'src/modules/notifications/notifications.module';
import * as ormconfig from '../../ormconfig';
import { ClaimableAuctionsService } from './claimable.auction.service';
import { ExpiredOffersService } from './expired.offers.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    CommonModule,
    AuctionsModuleGraph,
    NotificationsModuleGraph,
  ],
  providers: [ClaimableAuctionsService, ExpiredOffersService],
  exports: [ClaimableAuctionsService, ExpiredOffersService, CommonModule],
})
export class ClaimableModule {}
