import { Module } from '@nestjs/common';
import { AdminOperationsResolver } from './admin-operations.resolver';
import { ElrondCommunicationModule } from 'src/common';
import { FlagNftService } from './flag-nft.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftsFlagsRepository } from 'src/db/nftFlags';
import { VerifyContentService } from '../assets/verify-content.service';
import { CommonModule } from 'src/common.module';

@Module({
  providers: [AdminOperationsResolver, FlagNftService, VerifyContentService],
  imports: [
    CommonModule,
    ElrondCommunicationModule,
    TypeOrmModule.forFeature([NftsFlagsRepository]),
    CommonModule,
  ],
  exports: [FlagNftService],
})
export class AdminOperationsModuleGraph {}
