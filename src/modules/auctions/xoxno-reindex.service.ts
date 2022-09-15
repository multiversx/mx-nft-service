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
      const maxId = 31413;
      for (let index = 0; index < maxId; index++) {
        const auction = await this.auctionService.saveAuctionXoxno(
          index + 1,
          'elrondnftswap',
          'erd1qqqqqqqqqqqqqpgq8xwzu82v8ex3h4ayl5lsvxqxnhecpwyvwe0sf2qj4e',
        );
      }
    } catch (error) {
      this.logger.error(`Error when reindexing xoxno auctions`, {
        path: 'XoxnoReindexService.handleReindexXoxno',
        exception: error?.message,
      });
    }
  }
}
