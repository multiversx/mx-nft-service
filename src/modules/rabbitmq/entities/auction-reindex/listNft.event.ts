import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { ListNftEventsTopics } from './listNft.event.topics';

export class ListNftEvent extends EventLog {
  private decodedTopics: ListNftEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new ListNftEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
