import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/Relay.types';
import { Asset } from '.';
@ObjectType()
export class AssetsResponse extends relayTypes<Asset>(Asset) {}
