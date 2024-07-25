import { GenericEvent } from '../generic.event';
import { RandomNftEventsTopics } from './randomNft.event.topics';

export class RandomNftEvent extends GenericEvent {
  private decodedTopics: RandomNftEventsTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new RandomNftEventsTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }

  getData() {
    return this.data !== '' ? parseInt(Buffer.from(this.data, 'base64').toString('hex'), 16).toString() : '1';
  }
}
