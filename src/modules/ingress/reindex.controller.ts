import { Controller, Get } from '@nestjs/common';
import { NsfwUpdaterService } from 'src/crons/elastic.updater/nsfw.updater.service';
import { RarityUpdaterService } from 'src/crons/elastic.updater/rarity.updater.service';
import { XoxnoReindexService } from '../auctions/xoxno-reindex.service';

@Controller()
export class ReindexController {
  constructor(
    private nsfwRService: NsfwUpdaterService,
    private rarityUpdaterService: RarityUpdaterService,
    private xoxnoReindexService: XoxnoReindexService,
  ) {}

  @Get('/trigger-nsfw-reindex')
  async triggerNsfwReindex(): Promise<void> {
    await this.nsfwRService.updateNsfwWhereNone();
  }

  @Get('/trigger-rarity-reindex')
  async triggerRarityReindex(): Promise<void> {
    await this.rarityUpdaterService.handleReindexTokenRarities();
  }

  @Get('/trigger-xoxno-reindex')
  async triggerXoxnoReindex(): Promise<void> {
    console.log('triggerXoxnoReindex');
    this.xoxnoReindexService.handleReindexXoxno();
  }
}
