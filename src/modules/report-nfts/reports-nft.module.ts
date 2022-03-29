import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElrondCommunicationModule } from 'src/common';
import { ReportNftsRepository } from 'src/db/reportNft';
import { ReportNftsResolver } from './report-nfts.resolver';
import { ReportNftsService } from './report-nfts.service';

@Module({
  providers: [ReportNftsService, ReportNftsResolver],
  imports: [
    ElrondCommunicationModule,
    TypeOrmModule.forFeature([ReportNftsRepository]),
  ],
})
export class ReportNftsModuleGraph {}
