import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { ElrondSwapWithdrawTopics } from './elrondswap-withdraw.event.topics';

export class ElrondSwapWithdrawEvent extends EventLog {
  private decodedTopics: ElrondSwapWithdrawTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new ElrondSwapWithdrawTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
