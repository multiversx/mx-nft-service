import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NftScamUpdaterService } from './nft-scam.updater.service';

@Injectable()
export class ElasticScamUpdaterService {
  constructor(private readonly nftScamUpdaterService: NftScamUpdaterService) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async handleUpdateScamInfoWhereNotSetOrOutdatedCronJob() {
    await this.nftScamUpdaterService.handleUpdateScamInfoWhereNotSetOrOutdated();
  }
}
