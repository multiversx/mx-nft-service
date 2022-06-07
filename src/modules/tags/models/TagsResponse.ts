import { ObjectType } from '@nestjs/graphql';
import relayTypes from 'src/modules/common/Relay.types';
import { Tag } from './Tag.dto';

@ObjectType()
export class TagsResponse extends relayTypes<Tag>(Tag) {}
