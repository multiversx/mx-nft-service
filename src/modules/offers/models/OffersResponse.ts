import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/Relay.types';
import { Offer } from './Offer.dto';

@ObjectType()
export class OffersResponse extends relayTypes<Offer>(Offer) {}
