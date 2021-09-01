import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuctionsProvider } from './asset-auctions.loader';
import { AuctionEntity } from './auction.entity';
import { AuctionsServiceDb } from './auctions.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuctionEntity])],
  providers: [AuctionsServiceDb, AuctionsProvider],
  exports: [AuctionsServiceDb, AuctionsProvider],
})
export class AuctionsModuleDb {}
