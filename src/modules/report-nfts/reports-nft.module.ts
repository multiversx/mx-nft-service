import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElrondCommunicationModule } from 'src/common';
import { NftsFlagsRepository } from 'src/db/nftFlags';
import { ReportNftsRepository } from 'src/db/reportNft';
import { VerifyContentService } from '../assets/verify-content.service';
import { FlagNftService } from './flag-nft.service';
import { ReportNftsResolver } from './report-nfts.resolver';
import { ReportNftsService } from './report-nfts.service';

@Module({
  providers: [
    ReportNftsService,
    ReportNftsResolver,
    FlagNftService,
    VerifyContentService,
  ],
  imports: [
    forwardRef(() => ElrondCommunicationModule),
    TypeOrmModule.forFeature([ReportNftsRepository]),
    TypeOrmModule.forFeature([NftsFlagsRepository]),
  ],
})
export class ReportNftsModuleGraph {}
