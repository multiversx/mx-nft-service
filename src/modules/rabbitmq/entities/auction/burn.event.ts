import { GenericEvent } from '../generic.event';
import { BurnEventsTopics } from './burn.event.topics';

export class BurnEvent extends GenericEvent {
  private decodedTopics: BurnEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new BurnEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
