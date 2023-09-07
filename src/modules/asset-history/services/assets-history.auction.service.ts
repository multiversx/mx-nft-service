import { Injectable } from '@nestjs/common';
import { AssetActionEnum, AuctionEventEnum } from 'src/modules/assets/models';
import { AssetHistoryInput as AssetHistoryLogInput } from '../models/asset-history-log-input';

@Injectable()
export class AssetsHistoryAuctionService {
  constructor() {}

  mapAuctionEventLog(eventType: string, mainEvent: any): AssetHistoryLogInput {
    const event = mainEvent.events.find((event) => event.identifier === eventType);
    switch (eventType) {
      case AuctionEventEnum.AuctionTokenEvent: {
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.StartedAuction,
          address: event.topics[5].base64ToBech32(),
          itemsCount: event.topics[2],
          sender: event.address,
        });
      }
      case AuctionEventEnum.WithdrawEvent: {
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.ClosedAuction,
          address: event.topics[5]?.base64ToBech32() || '',
          itemsCount: event.topics[4],
        });
      }
      case AuctionEventEnum.EndAuctionEvent: {
        const [, , , , itemsCount, address, price] = event.topics;
        if (price) {
          return new AssetHistoryLogInput({
            event: mainEvent,
            action: AssetActionEnum.Bought,
            address: address.base64ToBech32(),
            itemsCount: itemsCount,
            price: price,
          });
        } else {
          return new AssetHistoryLogInput({
            event: mainEvent,
            action: AssetActionEnum.EndedAuction,
            address: address.base64ToBech32(),
            itemsCount: itemsCount,
            price: price,
          });
        }
      }
      case AuctionEventEnum.BuySftEvent: {
        const [, , , , itemsCount, address, price] = event.topics;
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.Bought,
          address: address.base64ToBech32(),
          itemsCount: itemsCount,
          price: price,
        });
      }
    }
  }
}
