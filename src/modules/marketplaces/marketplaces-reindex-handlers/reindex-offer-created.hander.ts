import { Injectable } from '@nestjs/common';

@Injectable()
export class ReindexOfferCreatedHandler {
  constructor() {}

  handle(): void {
    throw new Error('Not implemented yet');
  }
}
