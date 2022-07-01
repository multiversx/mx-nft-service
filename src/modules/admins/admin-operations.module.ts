import { Module } from '@nestjs/common';
import { AdminOperationsResolver } from './admin-operations.resolver';
import { ElrondCommunicationModule } from 'src/common';
import { FlagNftService } from './flag-nft.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NftsFlagsRepository } from 'src/db/nftFlags';
import { VerifyContentService } from '../assets/verify-content.service';

@Module({
  providers: [AdminOperationsResolver, FlagNftService, VerifyContentService],
  imports: [
    ElrondCommunicationModule,
    TypeOrmModule.forFeature([NftsFlagsRepository]),
  ],
  exports: [FlagNftService],
})
export class AdminOperationsModuleGraph {}
