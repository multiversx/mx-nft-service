import { EventLog } from 'src/modules/metrics/rabbitEvent';
import { ClaimEventsTopics } from './claim.event.topics';

export class ClaimEvent extends EventLog {
  private decodedTopics: ClaimEventsTopics;

  constructor(init?: Partial<EventLog>) {
    super(init);
    this.decodedTopics = new ClaimEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
