import { GenericEvent } from '../generic.event';
import { AcceptOfferXoxnoEventsTopics } from './acceptOfferXoxno.event.topics';

export class AcceptOfferXoxnoEvent extends GenericEvent {
  private decodedTopics: AcceptOfferXoxnoEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new AcceptOfferXoxnoEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
