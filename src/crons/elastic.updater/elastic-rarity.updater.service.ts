import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { cronJobs } from 'src/config';
import { NftRarityService } from 'src/modules/nft-rarity/nft-rarity.service';
import { RarityUpdaterService } from './rarity.updater.service';

@Injectable()
export class ElasticRarityUpdaterService {
  constructor(
    private readonly rarityUpdaterService: RarityUpdaterService,
    private readonly nftRarityService: NftRarityService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleUpdateAllCollectionsRarities() {
    await this.nftRarityService.updateAllCollectionsRarities();
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleValidateAllNftTraitValues() {
    await this.nftRarityService.validateAllCollectionsRarities();
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleUpdateTokenRaritiesCronJob() {
    await this.rarityUpdaterService.handleUpdateTokenRarities(
      cronJobs.rarity.colectionRaritiesToUpdateEvery10s,
    );
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleProcessTokenRarityQueueCronJob() {
    await this.rarityUpdaterService.processTokenRarityQueue();
  }
}
