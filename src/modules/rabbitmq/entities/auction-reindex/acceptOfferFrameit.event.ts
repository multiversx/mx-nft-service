import { GenericEvent } from '../generic.event';
import { AcceptOfferFrameitEventsTopics } from './acceptOfferFrameit.event.topics';

export class AcceptOfferFrameitEvent extends GenericEvent {
  private decodedTopics: AcceptOfferFrameitEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new AcceptOfferFrameitEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
