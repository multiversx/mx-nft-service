import { GenericEvent } from '../generic.event';
import { MintEventsTopics } from './mint.event.topics';

export class MintEvent extends GenericEvent {
  private decodedTopics: MintEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new MintEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
