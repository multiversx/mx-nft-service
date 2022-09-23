import { ObjectType } from '@nestjs/graphql';
import { Account } from 'src/modules/account-stats/models';
import relayTypes from 'src/modules/common/Relay.types';

@ObjectType()
export class ArtistResponse extends relayTypes<Account>(Account) {}
