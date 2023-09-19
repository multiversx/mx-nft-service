import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { cronJobs } from 'src/config';
import { RarityUpdaterService } from './rarity.updater.service';

@Injectable()
export class ElasticRarityUpdaterService {
  constructor(private readonly rarityUpdaterService: RarityUpdaterService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleUpdateAllCollectionsRarities() {
    await this.rarityUpdaterService.handleReindexAllTokenRarities();
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleValidateAllCollectionsRarities() {
    await this.rarityUpdaterService.handleValidateAllTokenRarities();
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleUpdateTokenRaritiesWhereNotSetCronJob() {
    await this.rarityUpdaterService.handleUpdateTokenRaritiesWhereNotSet(cronJobs.rarity.colectionRaritiesToUpdateEvery10s);
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleProcessTokenRarityQueueCronJob() {
    await this.rarityUpdaterService.processTokenRarityQueue();
  }
}
