import { ApiProvider } from '@elrondnetwork/erdjs';
import { elrondConfig } from 'config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ElrondApiService {
  private proxy: ApiProvider;
  constructor() {
    this.proxy = new ApiProvider(elrondConfig.elrondApi, 4000);
  }

  getService(): ApiProvider {
    return this.proxy;
  }
}
