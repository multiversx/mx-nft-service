import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/filters/Relay.types';
import { Asset } from '.';
@ObjectType()
export class AssetsResponse extends relayTypes<Asset>(Asset) {}
