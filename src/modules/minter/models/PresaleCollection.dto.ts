import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { elrondConfig } from 'src/config';
import { AuctionEntity } from 'src/db/auctions/auction.entity';
import {
  AuctionWithBidsCount,
  AuctionWithStartBid,
} from 'src/db/auctions/auctionWithBidCount.dto';
import { Account } from 'src/modules/account-stats/models';
import { Asset, Price } from 'src/modules/assets/models';
import { OrdersResponse } from 'src/modules/orders/models';
import { DateUtils } from 'src/utils/date-utils';
import { BrandInfo } from '.';

@ObjectType()
export class PresaleCollection {
  @Field(() => ID)
  collectionIpfhHash: number;

  @Field(() => String)
  collectionName: string;

  @Field(() => String)
  mediaType: string;

  @Field(() => String)
  collectionTicker: string;

  constructor(init?: Partial<PresaleCollection>) {
    Object.assign(this, init);
  }

  static fromEntity(auction: BrandInfo) {
    return new PresaleCollection({});
  }
}
