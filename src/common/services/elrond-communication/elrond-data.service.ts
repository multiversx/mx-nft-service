import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ApiService } from './api.service';

@Injectable()
export class ElrondDataService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly apiService: ApiService,
  ) {}

  async getQuotesHistoricalTimestamp(timestamp: number): Promise<number> {
    const url = `${process.env.ELROND_DATA}/closing/quoteshistorical/egld/price/${timestamp}`;

    try {
      let { data } = await this.apiService.get(url);

      return data;
    } catch (error) {
      this.logger.error(
        `An error occurred while calling the elrond data service on url ${url}`,
        {
          path: `ElrondDataService.${ElrondDataService.name}`,
          error,
        },
      );
      return;
    }
  }
}
