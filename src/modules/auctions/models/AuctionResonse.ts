import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/Relay.types';
import { Auction } from '.';

@ObjectType()
export class AuctionResponse extends relayTypes<Auction>(Auction) {}
