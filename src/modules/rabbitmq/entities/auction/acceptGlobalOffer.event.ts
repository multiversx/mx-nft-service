import { GenericEvent } from '../generic.event';
import { AcceptGlobalOfferEventsTopics } from './acceptGlobalOffer.event.topics';

export class AcceptGlobalOfferEvent extends GenericEvent {
  private decodedTopics: AcceptGlobalOfferEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new AcceptGlobalOfferEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
