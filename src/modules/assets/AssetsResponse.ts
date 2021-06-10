import { ObjectType } from '@nestjs/graphql';
import relayTypes from '../Relay.types';
import { Asset } from './models';
@ObjectType()
export default class AssetsResponse extends relayTypes<Asset>(Asset) {}
