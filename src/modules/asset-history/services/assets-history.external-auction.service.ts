import { Injectable } from '@nestjs/common';
import { AssetActionEnum, ExternalAuctionEventEnum, NftEventEnum } from 'src/modules/assets/models';
import { AssetHistoryInput as AssetHistoryLogInput } from '../models/asset-history-log-input';

@Injectable()
export class AssetsHistoryExternalAuctionService {
  constructor() {}

  mapExternalAuctionEventLog(nonce: string, eventType: string, mainEvent: any): AssetHistoryLogInput {
    const event = mainEvent.events.find((event) => event.identifier === eventType);
    const encodedNonce = Buffer.from(nonce, 'hex').toString('base64');
    const transferEvent = mainEvent.events.find(
      (event) =>
        (event.identifier === NftEventEnum.ESDTNFTTransfer || event.identifier === NftEventEnum.MultiESDTNFTTransfer) &&
        event.topics[1] === encodedNonce,
    );

    switch (eventType) {
      case ExternalAuctionEventEnum.Listing: {
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.StartedAuction,
          address: transferEvent.address,
          itemsCount: transferEvent.topics[2],
          sender: event.address,
        });
      }
      case ExternalAuctionEventEnum.Buy: {
        const senderAddress = event.address;
        const addresses = this.getAddressesFromTopics(event.topics, senderAddress);
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.Bought,
          address: addresses[0],
          itemsCount: mainEvent.events[0].topics[4],
          sender: event.address,
        });
      }
      case ExternalAuctionEventEnum.BuyNft: {
        const senderAddress = event.address;
        const addresses = this.getAddressesFromTopics(event.topics, senderAddress);
        const quantity = event.topics.length === 7 ? event.topics[4] : event.topics[7];
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.Bought,
          address: addresses[0],
          itemsCount: quantity,
          sender: senderAddress,
        });
      }
      case ExternalAuctionEventEnum.BulkBuy: {
        const buyNftEvent = mainEvent.events.find((event) => event.identifier === eventType && event.topics[2] === encodedNonce);
        const senderAddress = buyNftEvent.address;
        const addresses = this.getAddressesFromTopics(buyNftEvent.topics, senderAddress);
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.Bought,
          address: addresses[0],
          itemsCount: mainEvent.events[0].topics[4],
          sender: buyNftEvent.address,
        });
      }
    }
  }

  private getAddressesFromTopics(topics: string[], differentThanAddress?: string): string[] {
    const addresses: string[] = [];
    const possibleAddresses = topics?.filter((topic) => topic.length === 44);

    for (let i = 0; i < possibleAddresses?.length; i++) {
      addresses.push(Buffer.from(possibleAddresses[i], 'base64').toString('hex'));
    }

    if (differentThanAddress) {
      return addresses?.filter((address) => address !== differentThanAddress);
    }

    return addresses;
  }
}
