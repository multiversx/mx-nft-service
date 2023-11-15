import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/Relay.types';
import { Minter } from './Minter.dto';

@ObjectType()
export class MintersResponse extends relayTypes<Minter>(Minter) {}
