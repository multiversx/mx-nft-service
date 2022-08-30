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
      const maxId = 291000;
      for (let index = 0; index < maxId; index++) {
        const auction = await this.auctionService.saveAuctionXoxno(
          index + 1,
          'xoxno',
          'erd1qqqqqqqqqqqqqpgq6wegs2xkypfpync8mn2sa5cmpqjlvrhwz5nqgepyg8',
        );
        console.log({ auction });
      }
    } catch (error) {
      this.logger.error(`Error when reindexing xoxno auctions`, {
        path: 'XoxnoReindexService.handleReindexXoxno',
        exception: error?.message,
      });
    }
  }
}
