import { GenericEvent } from '../generic.event';
import { BuySftEventsTopics } from './buySft.event.topics';

export class BuySftEvent extends GenericEvent {
  private decodedTopics: BuySftEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new BuySftEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
