import { ObjectType } from '@nestjs/graphql';
import relayTypes from '../../Relay.types';
import { Asset } from '.';
@ObjectType()
export class AssetsResponse extends relayTypes<Asset>(Asset) {}
