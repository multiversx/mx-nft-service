import { GenericEvent } from '../generic.event';
import { BrandCreatedEventTopics } from './brandCreated.event.topics';

export class BrandCreatedEvent extends GenericEvent {
  private decodedTopics: BrandCreatedEventTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new BrandCreatedEventTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
