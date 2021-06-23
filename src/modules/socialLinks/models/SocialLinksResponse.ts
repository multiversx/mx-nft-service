import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/Relay.types';
import { SocialLink } from './social-links.dto';

@ObjectType()
export default class SocialLinksResponse extends relayTypes<SocialLink>(
  SocialLink,
) {}
