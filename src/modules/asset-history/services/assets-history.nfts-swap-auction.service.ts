import { Injectable } from '@nestjs/common';
import { AssetActionEnum, KroganSwapAuctionEventEnum } from 'src/modules/assets/models';
import { AssetHistoryInput as AssetHistoryLogInput } from '../models/asset-history-log-input';

@Injectable()
export class AssetsHistoryElrondNftsSwapEventsService {
  constructor() {}

  mapElrondNftsSwapEventLog(eventType: string, mainEvent: any): AssetHistoryLogInput {
    switch (eventType) {
      case KroganSwapAuctionEventEnum.NftSwap: {
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.StartedAuction,
          address: mainEvent.events[0].topics[3].base64ToBech32(),
          itemsCount: mainEvent.events[0].topics[2],
          sender: mainEvent.events[1].address,
        });
      }
      case KroganSwapAuctionEventEnum.WithdrawSwap: {
        const withdrawSwap = mainEvent.events.find((event) => event.identifier === eventType);
        const quantity = withdrawSwap.topics[4];
        const txSender = withdrawSwap.topics[5].base64ToBech32();
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.ClosedAuction,
          address: withdrawSwap.address,
          itemsCount: quantity,
          sender: txSender,
        });
      }
      case KroganSwapAuctionEventEnum.Purchase: {
        const purchaseEvent = mainEvent.events.find((event) => event.identifier === eventType);
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.Bought,
          address: purchaseEvent.topics[5].base64ToBech32(),
          itemsCount: purchaseEvent.topics[3],
          sender: purchaseEvent.address,
        });
      }
    }
  }
}
