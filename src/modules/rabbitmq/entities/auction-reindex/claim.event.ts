import { GenericEvent } from '../generic.event';
import { ClaimEventsTopics } from './claim.event.topics';

export class ClaimEvent extends GenericEvent {
  private decodedTopics: ClaimEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new ClaimEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
