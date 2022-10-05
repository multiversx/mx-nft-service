import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { cronJobs } from 'src/config';
import { TraitsUpdaterService } from './traits.updater.service';

@Injectable()
export class ElasticTraitsUpdaterService {
  constructor(private readonly traitsUpdaterService: TraitsUpdaterService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleSetTraitsWhereNotSetCronJob() {
    await this.traitsUpdaterService.handleSetTraitsWhereNotSet(
      cronJobs.traits.collectionTraitsToSetEvery10s,
    );
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleValidateTokenRaritiesCronJob() {
    await this.traitsUpdaterService.handleValidateTokenTraits(
      cronJobs.traits.collectionTraitsToValidateEvery5m,
    );
  }
}
