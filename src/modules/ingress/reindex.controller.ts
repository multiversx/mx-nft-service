import { Controller, Post } from '@nestjs/common';
import { NsfwUpdaterService } from 'src/crons/elastic.updater/nsfw.updater.service';
import { RarityUpdaterService } from 'src/crons/elastic.updater/rarity.updater.service';
import { NftScamService } from '../nft-scam/nft-scam.service';
import { NftTraitsService } from '../nft-traits/nft-traits.service';

@Controller()
export class ReindexController {
  constructor(
    private nsfwRService: NsfwUpdaterService,
    private rarityUpdaterService: RarityUpdaterService,
    private nftTraitsService: NftTraitsService,
    private nftScamService: NftScamService,
  ) {}

  @Post('/trigger-nsfw-reindex')
  async triggerNsfwReindex(): Promise<void> {
    await this.nsfwRService.updateNsfwWhereNone();
  }

  @Post('/trigger-rarity-reindex')
  async triggerRarityReindex(): Promise<void> {
    this.rarityUpdaterService.handleReindexAllTokenRarities();
  }

  @Post('/trigger-rarity-validation')
  async triggerRarityValidation(): Promise<void> {
    this.rarityUpdaterService.handleValidateAllTokenRarities();
  }

  @Post('/trigger-traits-reindex')
  async triggerTraitsReindex(): Promise<void> {
    this.nftTraitsService.updateAllCollectionTraits();
  }

  @Post('/trigger-scam-reindex')
  async triggerScamReindex(): Promise<void> {
    this.nftScamService.validateOrUpdateAllNftsScamInfo();
  }
}
