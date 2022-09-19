import { GenericEvent } from '../../generic.event';
import { ElrondSwapAuctionTopics } from './elrondswap-auction.event.topics';

export class ElrondSwapAuctionEvent extends GenericEvent {
  private decodedTopics: ElrondSwapAuctionTopics;

  constructor(init?: Partial<GenericEvent>) {
    super(init);
    this.decodedTopics = new ElrondSwapAuctionTopics(this.topics);
  }

  getTopics() {
    return this.decodedTopics.toPlainObject();
  }
}
