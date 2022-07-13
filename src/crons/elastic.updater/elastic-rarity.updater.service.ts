import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { cronJobs } from 'src/config';
import { RarityUpdaterService } from './rarity.updater.service';

@Injectable()
export class ElasticRarityUpdaterService {
  constructor(private readonly rarityUpdaterService: RarityUpdaterService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleValidateTokenRaritiesCronJob() {
    await this.rarityUpdaterService.handleValidateTokenRarities(
      cronJobs.rarity.collectionsToValidatePer5m,
    );
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleUpdateTokenRaritiesCronJob() {
    await this.rarityUpdaterService.handleUpdateTokenRarities(
      cronJobs.rarity.colectionsToUpdatePer30s,
    );
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleProcessTokenRarityQueueCronJob() {
    await this.rarityUpdaterService.processTokenRarityQueue();
  }
}
