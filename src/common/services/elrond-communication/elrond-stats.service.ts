import { Injectable, Logger } from '@nestjs/common';
import { removeCredentialsFromUrl } from 'src/utils/helpers';
import { ApiService } from './api.service';
import { NftViewsCount } from './models/nft-views.dto';

@Injectable()
export class ElrondStatsService {
  constructor(
    private readonly logger: Logger,
    private readonly apiService: ApiService,
  ) {}

  async getTrending(dimension: 'identifier' | 'collection'): Promise<string[]> {
    const url = `${process.env.ELROND_STATS}api/v1/trending/${dimension}`;

    try {
      const response = await this.apiService.get(url);
      return response.data;
    } catch (error) {
      this.logger.error(
        `An error occurred while calling the elrond stats service on url ${removeCredentialsFromUrl(
          url,
        )}`,
        {
          path: 'ElrondStatsService.getTrending',
          dimension,
          exception: error,
        },
      );
      return;
    }
  }

  async getNftsViewsCount(identifier: string): Promise<NftViewsCount> {
    const url = `${process.env.ELROND_STATS}api/v1/views/nfts/${identifier}/count`;

    try {
      const response = await this.apiService.get(url);
      return response.data;
    } catch (error) {
      this.logger.error(
        `An error occurred while calling the elrond stats service on url ${removeCredentialsFromUrl(
          url,
        )}`,
        {
          path: 'ElrondStatsService.getNftsViewsCount',
          identifier,
          exception: error,
        },
      );
      return new NftViewsCount({ identifier: identifier, viewsCount: 0 });
    }
  }
}
