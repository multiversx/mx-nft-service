import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ApiService } from './api.service';
import { ApiSettings } from './models/api-settings';
import { Feed } from './models/feed.dto';
import { SubscriptionFeed } from './models/subscription-feed.dto';

@Injectable()
export class ElrondFeedService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly apiService: ApiService,
  ) {}

  async subscribe(identifier: string, authKey?: string): Promise<boolean> {
    const url = `${process.env.ELROND_FEED}v1/subscriptions`;

    try {
      const request = new SubscriptionFeed({ reference: identifier });
      const response = await this.apiService.post(
        url,
        request,
        new ApiSettings({
          apiKey: process.env.ELROND_FEED_API_KEY,
          authorization: authKey,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `An error occurred while calling the elrond feed api on url ${url}`,
        {
          path: 'ElrondFeedService.subscribe',
          identifier,
          exception: error,
        },
      );
      return;
    }
  }

  async unsubscribe(reference: string, authKey?: string): Promise<boolean> {
    const url = `${process.env.ELROND_FEED}v1/subscriptions`;

    try {
      const request = new SubscriptionFeed({ reference: reference });

      const response = await this.apiService.delete(
        url,
        new ApiSettings({
          apiKey: process.env.ELROND_FEED_API_KEY,
          authorization: authKey,
        }),
        request,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `An error occurred while calling the elrond feed api on url ${url}`,
        {
          path: 'ElrondFeedService.subscribe',
          reference,
          exception: error,
        },
      );
      return;
    }
  }

  async addFeed(feed: Feed): Promise<Feed> {
    const url = `${process.env.ELROND_FEED}v1/feed/item`;

    try {
      const response = await this.apiService.post(
        url,
        feed,
        new ApiSettings({ apiKey: process.env.ELROND_FEED_API_KEY }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `An error occurred while calling the elrond feed api on url ${url}`,
        {
          path: 'ElrondFeedService.addFeed',
          feed: feed,
          exception: error,
        },
      );
      return;
    }
  }
}
