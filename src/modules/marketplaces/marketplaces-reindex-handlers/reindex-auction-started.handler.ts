import { Injectable } from '@nestjs/common';

@Injectable()
export class ReindexAuctionStartedHandler {
  constructor() {}

  handle(): void {
    throw new Error('Not implemented yet');
  }
}
