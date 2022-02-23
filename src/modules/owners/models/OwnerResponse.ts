import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/filters/Relay.types';
import { Owner } from './Owner.dto';

@ObjectType()
export class OwnerResponse extends relayTypes<Owner>(Owner) {}
