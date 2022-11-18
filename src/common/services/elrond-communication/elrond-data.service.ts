import { Injectable, Logger } from '@nestjs/common';
import { removeCredentialsFromUrl } from 'src/utils/helpers';
import { ApiService } from './api.service';

@Injectable()
export class ElrondDataService {
  constructor(
   private readonly logger: Logger,
    private readonly apiService: ApiService,
  ) {}

  async getQuotesHistoricalTimestamp(timestamp: number): Promise<number> {
    const url = `${process.env.ELROND_DATA}/closing/quoteshistorical/egld/price/${timestamp}`;

    try {
      let { data } = await this.apiService.get(url);

      return data;
    } catch (error) {
      this.logger.error(
        `An error occurred while calling the elrond data service on url ${removeCredentialsFromUrl(
          url,
        )}`,
        {
          path: `ElrondDataService.${ElrondDataService.name}`,
          error,
        },
      );
      return;
    }
  }
}
