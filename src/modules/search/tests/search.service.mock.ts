import { Injectable } from '@nestjs/common';

@Injectable()
export class SearchServiceMock {
  async getClaimableCount(_address: string): Promise<number> {
    return Promise.resolve(4);
  }

  async getCollectedCount(_address: string): Promise<number> {
    return Promise.resolve(4);
  }

  async getCollectionsCount(_address: string): Promise<number> {
    return Promise.resolve(2);
  }
  async getCreationsCount(_address: string): Promise<any> {
    return Promise.resolve(10);
  }
}
