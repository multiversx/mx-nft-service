import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { BuySftEventsTopics } from './buySft.event.topics';

export class BuySftEvent extends EventLog {
  private decodedTopics: BuySftEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new BuySftEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
