import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { ElrondSwapUpdateTopics } from './elrondswap-updateAuction.event.topics';

export class ElrondSwapUpdateEvent extends EventLog {
  private decodedTopics: ElrondSwapUpdateTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new ElrondSwapUpdateTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
