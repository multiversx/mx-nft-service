import { Injectable } from '@nestjs/common';

@Injectable()
export class ReindexOfferClosedHandler {
  constructor() {}

  handle(): void {
    throw new Error('Not implemented yet');
  }
}
