import { GenericEvent } from '../generic.event';
import { UpdatePriceDeadrareEventsTopics } from './updatePriceDeadrare.event.topics';

export class UpdatePriceDeadrareEvent extends GenericEvent {
  private decodedTopics: UpdatePriceDeadrareEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new UpdatePriceDeadrareEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
