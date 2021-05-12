import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionEntity } from './auction.entity';
import { AuctionsServiceDb } from './auctions.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuctionEntity])],
  providers: [AuctionsServiceDb],
})
export class AuctionsModuleDb {}
