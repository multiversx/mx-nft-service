import { ObjectType } from '@nestjs/graphql';
import { GenericEvent } from '../generic.event';
import { BidEventsTopics } from './bid.event.topics';

@ObjectType()
export class BidEvent extends GenericEvent {
  private decodedTopics: BidEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new BidEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
