import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { WithdrawEventsTopics } from './withdraw.event.topics';

export class WithdrawEvent extends EventLog {
  private decodedTopics: WithdrawEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new WithdrawEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
