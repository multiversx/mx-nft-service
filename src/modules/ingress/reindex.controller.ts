import { Controller, Get } from '@nestjs/common';
import { ElasticNsfwUpdaterService } from 'src/crons/elastic.updater/elastic-nsfw.updater.service';
import { ElasticRarityUpdaterService } from 'src/crons/elastic.updater/elastic-rarity.updater.service';

@Controller()
export class ReindexController {
  constructor(
    private nsfwRService: ElasticNsfwUpdaterService,
    private rarityService: ElasticRarityUpdaterService,
  ) {}

  @Get('/trigger-nsfw-reindex')
  async triggerNsfwReindex(): Promise<void> {
    await this.nsfwRService.handleValidateNsfw();
  }

  @Get('/trigger-rarity-reindex')
  async triggerRarityReindex(): Promise<void> {
    await this.rarityService.handleValidateTokenRarity();
  }
}
