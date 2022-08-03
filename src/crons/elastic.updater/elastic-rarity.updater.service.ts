import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { cronJobs } from 'src/config';
import { RarityUpdaterService } from './rarity.updater.service';

@Injectable()
export class ElasticRarityUpdaterService {
  constructor(private readonly rarityUpdaterService: RarityUpdaterService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleValidateTokenRaritiesCronJob() {
    await this.rarityUpdaterService.handleValidateTokenRarities(
      cronJobs.rarity.collectionRaritiesToValidateEvery5m,
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleValidateTokenRarityFlagsCronJob() {
    await this.rarityUpdaterService.handleValidateTokenRarityFlags(
      cronJobs.rarity.collectionRarityFlagsToValidateEvery1m,
    );
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
