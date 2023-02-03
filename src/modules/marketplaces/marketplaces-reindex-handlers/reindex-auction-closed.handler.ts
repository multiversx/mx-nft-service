import { Injectable } from '@nestjs/common';

@Injectable()
export class ReindexAuctionClosedHandler {
  constructor() {}

  handle(): void {
    throw new Error('Not implemented yet');
  }
}
