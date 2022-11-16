import { forwardRef, Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElrondCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { ReportNftsRepository } from 'src/db/reportNft';
import { ReportNftsResolver } from './report-nfts.resolver';
import { ReportNftsService } from './report-nfts.service';

@Module({
  providers: [Logger, ReportNftsService, ReportNftsResolver],
  imports: [
    CommonModule,
    forwardRef(() => ElrondCommunicationModule),
    TypeOrmModule.forFeature([ReportNftsRepository]),
  ],
})
export class ReportNftsModuleGraph {}
