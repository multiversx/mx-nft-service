import { GenericEvent } from '../../generic.event';
import { AcceptOfferEventsTopics } from './acceptOffer.event.topics';

export class AcceptOfferEvent extends GenericEvent {
  private decodedTopics: AcceptOfferEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new AcceptOfferEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
