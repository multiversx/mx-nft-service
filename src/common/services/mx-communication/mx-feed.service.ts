import { Injectable, Logger } from '@nestjs/common';
import { removeCredentialsFromUrl } from 'src/utils/helpers';
import { ApiService } from './api.service';
import { ApiSettings } from './models/api-settings';
import { Feed } from './models/feed.dto';
import { SubscriptionFeed } from './models/subscription-feed.dto';

@Injectable()
export class MxFeedService {
  constructor(private readonly logger: Logger, private readonly apiService: ApiService) {}

  async subscribe(identifier: string, authKey?: string): Promise<boolean> {
    if (process.env.ENABLE_FEED_EVENTS === 'true') {
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
        this.logger.error(`An error occurred while calling the mx feed api on url ${removeCredentialsFromUrl(url)}`, {
          path: `${MxFeedService.name}.${this.subscribe.name}`,
          identifier,
          exception: error,
        });
        return;
      }
    }
    return;
  }

  async unsubscribe(reference: string, authKey?: string): Promise<boolean> {
    if (process.env.ENABLE_FEED_EVENTS === 'true') {
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
        this.logger.error(`An error occurred while calling the mx feed api on url ${removeCredentialsFromUrl(url)}`, {
          path: `${MxFeedService.name}.${this.unsubscribe.name}`,
          reference,
          exception: error,
        });
        return;
      }
    }
    return;
  }

  async addFeed(feed: Feed): Promise<Feed> {
    if (process.env.ENABLE_FEED_EVENTS === 'true') {
      const url = `${process.env.ELROND_FEED}v1/feed/item`;

      try {
        const response = await this.apiService.post(url, feed, new ApiSettings({ apiKey: process.env.ELROND_FEED_API_KEY }));
        return response.data;
      } catch (error) {
        this.logger.error(`An error occurred while calling the mx feed api on url ${removeCredentialsFromUrl(url)}`, {
          path: `${MxFeedService.name}.${this.addFeed.name}`,
          feed: feed,
          exception: error,
        });
        return;
      }
    }

    return;
  }
}
