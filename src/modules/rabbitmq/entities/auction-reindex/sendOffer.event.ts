import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { SendOfferEventsTopics } from './sendOffer.event.topics';

export class SendOfferEvent extends EventLog {
  private decodedTopics: SendOfferEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new SendOfferEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
