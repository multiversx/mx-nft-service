import { Injectable } from '@nestjs/common';
import { ElrondIdentityService } from 'src/common';
import { Account } from '../account-stats/models';
import { ArtistFilters } from './models/Artists.Filter';

@Injectable()
export class ArtistsService {
  constructor(private idService: ElrondIdentityService) {}

  async getArtists(
    filters: ArtistFilters,
    page: number = 0,
    size: number = 25,
  ): Promise<Account[]> {
    const accounts = await this.idService.getMostFollowed(1);
    return accounts?.map((account) => Account.fromEntity(account));
  }
}
