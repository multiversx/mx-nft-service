import { Injectable } from '@nestjs/common';

@Injectable()
export class ReindexAuctionEndedHandler {
  constructor() {}

  handle(): void {
    throw new Error('Not implemented yet');
  }
}
