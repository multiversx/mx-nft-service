import { Injectable } from '@nestjs/common';
import { AssetActionEnum, AuctionEventEnum } from 'src/modules/assets/models';
import { AssetHistoryInput as AssetHistoryLogInput } from '../models/asset-history-log-input';

@Injectable()
export class AssetsHistoryAuctionService {
  constructor() {}

  mapAuctionEventLog(eventType: string, mainEvent: any): AssetHistoryLogInput {
    switch (eventType) {
      case AuctionEventEnum.AuctionTokenEvent: {
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.StartedAuction,
          address: mainEvent._source.events[1].address,
          itemsCount: mainEvent._source.events[0].topics[2],
          sender: mainEvent._source.events[1].topics[5].base64ToBech32(),
        });
      }
      case AuctionEventEnum.WithdrawEvent: {
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.ClosedAuction,
          address:
            mainEvent._source.events[1].topics[5]?.base64ToBech32() || '',
          itemsCount: mainEvent._source.events[1].topics[4],
        });
      }
      case AuctionEventEnum.EndAuctionEvent: {
        const [, , , , itemsCount, address, price] =
          mainEvent._source.events[1].topics;
        if (price) {
          return new AssetHistoryLogInput({
            event: mainEvent,
            action: AssetActionEnum.Bought,
            address: address.base64ToBech32(),
            itemsCount: mainEvent._source.events[0].topics[2],
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
        const [, , , , itemsCount, address, price] =
          mainEvent._source.events[1].topics;
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
