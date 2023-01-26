import { Controller, Post } from '@nestjs/common';
import { NsfwUpdaterService } from 'src/crons/elastic.updater/nsfw.updater.service';
import { RarityUpdaterService } from 'src/crons/elastic.updater/rarity.updater.service';
import { MarketplaceEventsIndexingService } from '../marketplaces/marketplaces-events-indexing.service';
import { NftScamService } from '../scam/nft-scam.service';
import { NftTraitsService } from '../nft-traits/nft-traits.service';

@Controller()
export class ReindexController {
  constructor(
    private nsfwRService: NsfwUpdaterService,
    private rarityUpdaterService: RarityUpdaterService,
    private nftTraitsService: NftTraitsService,
    private nftScamService: NftScamService,
    private marketplacesEventsIndexingService: MarketplaceEventsIndexingService,
  ) {}

  @Post('/trigger-reindex-all') async triggerAllReindexes(): Promise<void> {
    await this.triggerNsfwReindex();
    await this.triggerScamReindex();
    await this.triggerTraitsReindex();
    await this.triggerRarityValidation();
    await this.triggerLatestMarketplacesEventsReindex();
  }

  @Post('/trigger-nsfw-reindex')
  async triggerNsfwReindex(): Promise<void> {
    await this.nsfwRService.updateNsfwWhereNone();
  }

  @Post('/trigger-nsfw-clean-reindex')
  async triggerNsfwReindexFromDb(): Promise<void> {
    await this.nsfwRService.cleanReindexing();
  }

  @Post('/trigger-rarity-reindex')
  async triggerRarityReindex(): Promise<void> {
    await this.rarityUpdaterService.handleReindexAllTokenRarities();
  }

  @Post('/trigger-rarity-validation')
  async triggerRarityValidation(): Promise<void> {
    await this.rarityUpdaterService.handleValidateAllTokenRarities();
  }

  @Post('/trigger-traits-reindex')
  async triggerTraitsReindex(): Promise<void> {
    await this.nftTraitsService.updateAllCollectionTraits();
  }

  @Post('/trigger-scam-reindex')
  async triggerScamReindex(): Promise<void> {
    await this.nftScamService.validateOrUpdateAllNftsScamInfo();
  }

  @Post('/trigger-latest-marketplaces-events-reindex')
  async triggerLatestMarketplacesEventsReindex(): Promise<void> {
    await this.marketplacesEventsIndexingService.reindexAllMarketplaceEvents();
  }
}
