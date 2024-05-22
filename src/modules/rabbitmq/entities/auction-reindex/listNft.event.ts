import { GenericEvent } from '../generic.event';
import { ListNftEventsTopics } from './listNft.event.topics';

export class ListNftEvent extends GenericEvent {
  private decodedTopics: ListNftEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new ListNftEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
