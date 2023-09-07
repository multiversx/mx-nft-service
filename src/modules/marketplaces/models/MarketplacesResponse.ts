import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/Relay.types';
import { Marketplace } from './Marketplace.dto';

@ObjectType()
export class MarketplacesResponse extends relayTypes<Marketplace>(Marketplace) {}
