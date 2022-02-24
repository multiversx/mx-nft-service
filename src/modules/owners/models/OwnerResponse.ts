import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/Relay.types';
import { Owner } from './Owner.dto';

@ObjectType()
export class OwnerResponse extends relayTypes<Owner>(Owner) {}
