import { Injectable } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { Owner } from './models';

@Injectable()
export class OwnersService {
  constructor(private apiService: MxApiService) {}

  async getOwnersForIdentifier(identifier: string, offset: number, limit: number): Promise<[Owner[], number]> {
    const [nfts, count] = await Promise.all([
      this.apiService.getOwnersForIdentifier(identifier, offset, limit),
      this.apiService.getOwnersForIdentifierCount(identifier),
    ]);
    const assets = nfts?.map((element) => Owner.fromApiOwner(element, identifier));
    return [assets, count];
  }
}
