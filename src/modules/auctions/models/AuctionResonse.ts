import { Field, ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/Relay.types';
import { Auction } from '.';
import { PriceRange } from './PriceRange.dto';

@ObjectType()
export class AuctionResponse extends relayTypes<Auction>(Auction) {
  @Field(() => PriceRange, { nullable: true })
  public priceRange: PriceRange;
}
