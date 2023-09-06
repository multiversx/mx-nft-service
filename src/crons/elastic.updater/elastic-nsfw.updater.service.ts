import { Locker } from '@multiversx/sdk-nestjs-common';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NsfwUpdaterService } from './nsfw.updater.service';

@Injectable()
export class ElasticNsfwUpdaterService {
  constructor(private nsfwUpdaterService: NsfwUpdaterService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleValidateNsfw() {
    await Locker.lock(
      'Elastic updater: Update tokens nsfw from database',
      async () => {
        await this.nsfwUpdaterService.validateNsfwFlags();
      },
      true,
    );
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleUpdateTokenNsfw() {
    await Locker.lock(
      'Elastic updater: Update tokens nsfw',
      async () => {
        await this.nsfwUpdaterService.updateNsfwWhereNone();
      },
      true,
    );
  }
}
