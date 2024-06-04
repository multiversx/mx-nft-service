import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { WithdrawOfferEventsTopics } from './withdrawOffer.event.topics';

export class WithdrawOfferEvent extends EventLog {
  private decodedTopics: WithdrawOfferEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new WithdrawOfferEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
