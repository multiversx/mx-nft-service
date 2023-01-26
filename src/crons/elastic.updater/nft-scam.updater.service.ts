import { Injectable } from '@nestjs/common';
import { NftScamService } from 'src/modules/scam/nft-scam.service';

@Injectable()
export class NftScamUpdaterService {
  constructor(private readonly nftScamService: NftScamService) {}

  async handleUpdateScamInfoWhereNotSetOrOutdated(): Promise<void> {
    await this.nftScamService.validateOrUpdateAllNftsScamInfo();
  }
}
