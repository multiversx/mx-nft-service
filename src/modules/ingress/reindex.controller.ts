import { Controller, Get } from '@nestjs/common';
import { NsfwUpdaterService } from 'src/crons/elastic.updater/nsfw.updater.service';
import { RarityUpdaterService } from 'src/crons/elastic.updater/rarity.updater.service';

@Controller()
export class ReindexController {
  constructor(
    private nsfwRService: NsfwUpdaterService,
    private rarityService: RarityUpdaterService,
  ) {}

  @Get('/trigger-nsfw-reindex')
  async triggerNsfwReindex(): Promise<void> {
    await this.nsfwRService.updateNsfwWhereNone();
  }

  @Get('/trigger-rarity-reindex')
  async triggerRarityReindex(): Promise<void> {
    await this.rarityService.handleUpdateToken();
  }
}
