import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionEntity } from './auction.entity';
import { AuctionsService } from './auctions.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuctionEntity])],
  providers: [AuctionsService],
})
export class AuctionsModule {}
