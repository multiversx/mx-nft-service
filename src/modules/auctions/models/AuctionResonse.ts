import { ObjectType } from '@nestjs/graphql';
import { Auction } from '.';
import relayTypes from '../../Relay.types';

@ObjectType()
export default class AuctionResponse extends relayTypes<Auction>(Auction) {}
