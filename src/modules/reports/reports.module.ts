import { forwardRef, Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MxCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { ReportNftsRepository } from 'src/db/reports';
import { AuthModule } from '../auth/auth.module';
import { ReportsResolver } from './reports.resolver';
import { ReportsService } from './reports.service';

@Module({
  providers: [ReportsService, ReportsResolver],
  imports: [
    CommonModule,
    forwardRef(() => MxCommunicationModule),
    forwardRef(() => AuthModule),
  ],
  exports: [ReportsService],
})
export class ReportsModuleGraph {}
