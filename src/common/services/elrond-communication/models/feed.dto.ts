export class Feed {
  topic: TopicEnum;
  event: EventEnum;
  identifier: string;
  subscription: string;
  extraInfo: {
    name: string;
    avatar: string;
  };
  constructor(init?: Partial<Feed>) {
    Object.assign(this, init);
  }
}

export enum EventEnum {
  like = 'like',
  unlike = 'unlike',
  follow = 'follow',
  unfollow = 'unfollow',
  createCollection = 'createCollection',
  mintNft = 'mintNft',
  startAuction = 'startAuction',
  bid = 'bid',
  buy = 'buy',
  won = 'won',
}

export enum TopicEnum {
  account = 'account',
  nft = 'nft',
}
