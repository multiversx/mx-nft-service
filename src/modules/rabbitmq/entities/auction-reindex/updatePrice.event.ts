import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { UpdatePriceEventsTopics } from './updatePrice.event.topics';

export class UpdatePriceEvent extends EventLog {
  private decodedTopics: UpdatePriceEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new UpdatePriceEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
