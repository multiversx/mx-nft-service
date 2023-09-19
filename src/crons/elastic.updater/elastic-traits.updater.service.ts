import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { cronJobs } from 'src/config';
import { NftTraitsService } from 'src/modules/nft-traits/nft-traits.service';
import { TraitsUpdaterService } from './traits.updater.service';

@Injectable()
export class ElasticTraitsUpdaterService {
  constructor(private readonly traitsUpdaterService: TraitsUpdaterService, private readonly nftTraitsService: NftTraitsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleValidateAllTokenTraits() {
    await this.nftTraitsService.updateAllCollectionTraits();
  }

  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async handleValidateAllNftTraitValues() {
    await this.nftTraitsService.updateAllNftTraits();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleSetTraitsWhereNotSetCronJob() {
    await this.traitsUpdaterService.handleSetTraitsWhereNotSet(cronJobs.traits.collectionTraitsToSetEvery1m);
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleProcessTokenRarityQueueCronJob() {
    await this.traitsUpdaterService.processTokenTraitsQueue();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleValidateTokenTraitsCronJob() {
    await this.traitsUpdaterService.handleValidateTokenTraits(cronJobs.traits.collectionTraitsToValidateEvery5m);
  }
}
