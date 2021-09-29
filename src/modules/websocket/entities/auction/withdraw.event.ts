import { ObjectType } from '@nestjs/graphql';
import { GenericEvent } from '../generic.event';
import { BidEventsTopics } from './bid.event.topics';
import { WithdrawEventsTopics } from './withdraw.event.topics';

@ObjectType()
export class WithdrawEvent extends GenericEvent {
  private decodedTopics: WithdrawEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new WithdrawEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
