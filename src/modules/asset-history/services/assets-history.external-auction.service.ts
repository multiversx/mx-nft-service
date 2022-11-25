import { Injectable } from '@nestjs/common';
import {
  AssetActionEnum,
  ExternalAuctionEventEnum,
} from 'src/modules/assets/models';
import { AssetHistoryInput as AssetHistoryLogInput } from '../models/asset-history-log-input';

@Injectable()
export class AssetsHistoryExternalAuctionService {
  constructor() {}

  mapExternalAuctionEventLog(
    nonce: string,
    eventType: string,
    mainEvent: any,
  ): AssetHistoryLogInput {
    switch (eventType) {
      case ExternalAuctionEventEnum.Listing: {
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.StartedAuction,
          address: mainEvent._source.events[0].topics[3].base64ToBech32(),
          itemsCount: mainEvent._source.events[0].topics[2],
          sender: mainEvent._source.events[1].address,
        });
      }
      case ExternalAuctionEventEnum.Buy: {
        const buyNftEvent = mainEvent._source.events.find(
          (event) => event.identifier === eventType,
        );
        const senderAddress = buyNftEvent.address;
        const addresses = this.getAddressesFromTopics(
          buyNftEvent.topics,
          senderAddress,
        );
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.Bought,
          address: addresses[0],
          itemsCount: mainEvent._source.events[0].topics[4],
          sender: buyNftEvent.address,
        });
      }
      case ExternalAuctionEventEnum.BuyNft: {
        const buyNftEvent = mainEvent._source.events.find(
          (event) => event.identifier === eventType,
        );
        const senderAddress = buyNftEvent.address;
        const addresses = this.getAddressesFromTopics(
          buyNftEvent.topics,
          senderAddress,
        );
        const quantity =
          buyNftEvent.topics.length === 7
            ? mainEvent._source.events[0].topics[4]
            : mainEvent._source.events[0].topics[7];

        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.Bought,
          address: addresses[0],
          itemsCount: quantity,
          sender: buyNftEvent.address,
        });
      }
      case ExternalAuctionEventEnum.BulkBuy: {
        const encodedNonce = Buffer.from(nonce, 'hex').toString('base64'); //BinaryUtils.base64Encode(nonce);
        const buyNftEvent = mainEvent._source.events.find(
          (event) =>
            event.identifier === eventType && event.topics[2] === encodedNonce,
        );
        const senderAddress = buyNftEvent.address;
        const addresses = this.getAddressesFromTopics(
          buyNftEvent.topics,
          senderAddress,
        );

        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.Bought,
          address: addresses[0],
          itemsCount: mainEvent._source.events[0].topics[4],
          sender: buyNftEvent.address,
        });
      }
      case ExternalAuctionEventEnum.AcceptOffer: {
        const acceptOfferEvent = mainEvent._source.events.find(
          (event) => event.identifier === eventType,
        );
        const senderAddress = acceptOfferEvent.address;
        const addresses = this.getAddressesFromTopics(
          acceptOfferEvent.topics,
          senderAddress,
        );
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.AcceptedOffer,
          address: addresses[0],
          itemsCount: mainEvent._source.events[0].topics[4],
          sender: acceptOfferEvent.address,
        });
      }
      case ExternalAuctionEventEnum.AcceptGlobalOffer: {
        const acceptEvent = mainEvent._source.events.find(
          (event) => event.identifier === eventType,
        );
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.AcceptedOffer,
          address: acceptEvent.topics[2].base64ToBech32(),
          itemsCount: acceptEvent.topics[4],
          sender: acceptEvent.address,
        });
      }
    }
  }

  private getAddressesFromTopics(
    topics: string[],
    differentThanAddress?: string,
  ): string[] {
    const addresses: string[] = [];
    const possibleAddresses = topics?.filter((topic) => topic.length === 44);

    for (let i = 0; i < possibleAddresses?.length; i++) {
      try {
        addresses.push(possibleAddresses[i].base64ToBech32());
      } catch {
        // ignore
      }
    }

    if (differentThanAddress) {
      return addresses?.filter((address) => address !== differentThanAddress);
    }

    return addresses;
  }
}
