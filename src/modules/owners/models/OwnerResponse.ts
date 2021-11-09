import { ObjectType } from '@nestjs/graphql';
import relayTypes from '../../Relay.types';
import { Owner } from './Owner.dto';

@ObjectType()
export class OwnerResponse extends relayTypes<Owner>(Owner) {}
