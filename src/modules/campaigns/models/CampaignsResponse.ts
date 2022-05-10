import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/Relay.types';
import { Campaign } from './Campaign.dto';

@ObjectType()
export class CampaignsResponse extends relayTypes<Campaign>(Campaign) {}
