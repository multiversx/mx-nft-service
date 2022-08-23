import { Injectable, Logger } from '@nestjs/common';
import { AuctionsSetterService } from './auctions-setter.service';

@Injectable()
export class XoxnoReindexService {
  constructor(
    private readonly auctionService: AuctionsSetterService,
    private readonly logger: Logger,
  ) {}

  async handleReindexXoxno() {
    try {
      const maxId = 286042;
      const startId = 1;
      while (startId <= maxId) {
        await this.auctionService.saveAuctionXoxno(
          startId,
          'xoxno',
          'erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8',
        );
      }
    } catch (error) {
      this.logger.error(`Error when reindexing collection rarities`, {
        path: 'RarityUpdaterService.handleReindexTokenRarities',
        exception: error?.message,
      });
    }
  }
}
