import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ApiService } from '../api.service';
import { EventEnum, Feed, TopicEnum } from './models/feed.dto';

@Injectable()
export class ElrondFeedService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly apiService: ApiService,
  ) {}

  async subscribe(identifier: string, token?: string): Promise<boolean> {
    const url = `${process.env.ELROND_FEED}api/v1/subscribe/nft:${identifier}`;

    try {
      console.log(identifier, token);
      return true;
      const response = await this.apiService.post(url, '', undefined, token);
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
    const url = `${process.env.ELROND_FEED}api/v1/subscribe/nft:${reference}`;

    try {
      console.log(reference, authKey);
      return true;
      const response = await this.apiService.delete(url, undefined, authKey);
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
    const url = `${process.env.ELROND_FEED}api/v1/feed`;

    try {
      console.log(feed);
      return feed;
      const response = await this.apiService.post(url, feed);
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
