import { TopicEnum } from './feed.dto';

export class SubscriptionFeed {
  topic: TopicEnum = TopicEnum.nft;
  reference: string;

  constructor(init?: Partial<SubscriptionFeed>) {
    Object.assign(this, init);
  }
}
