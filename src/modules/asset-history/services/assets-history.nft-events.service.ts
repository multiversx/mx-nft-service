import { Injectable } from '@nestjs/common';
import { mxConfig } from 'src/config';
import { AssetActionEnum, NftEventEnum } from 'src/modules/assets/models';
import { base64ToBech32 } from 'src/utils/helpers';
import { AssetHistoryInput as AssetHistoryLogInput } from '../models/asset-history-log-input';

@Injectable()
export class AssetsHistoryNftEventService {
  constructor() {}

  mapNftEventLog(nonce: string, eventType: string, mainEvent: any): AssetHistoryLogInput {
    const event = mainEvent.events.find((event) => event.identifier === eventType);
    const encodedNonce = Buffer.from(nonce, 'hex').toString('base64');
    const transferEvent = mainEvent.events.find(
      (event) =>
        (event.identifier === NftEventEnum.ESDTNFTTransfer || event.identifier === NftEventEnum.MultiESDTNFTTransfer) &&
        event.topics[1] === encodedNonce,
    );

    switch (eventType) {
      case NftEventEnum.ESDTNFTAddQuantity: {
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.Added,
          address: mainEvent.address,
          itemsCount: mainEvent.events[0].topics[2],
        });
      }
      case NftEventEnum.ESDTNFTCreate: {
        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.Created,
          address: event.address,
          itemsCount: event.topics[2],
          sender: base64ToBech32(transferEvent?.topics[3]),
        });
      }
      case NftEventEnum.ESDTNFTTransfer: {
        const address = base64ToBech32(transferEvent?.topics[3]);
        if (mainEvent.address === mainEvent?.events[0].address && address !== mxConfig.nftMarketplaceAddress) {
          return new AssetHistoryLogInput({
            event: mainEvent,
            action: AssetActionEnum.Received,
            address: address,
            itemsCount: transferEvent.topics[2],
            sender: transferEvent.address,
          });
        }
      }
      case NftEventEnum.MultiESDTNFTTransfer: {
        const senderAddress = transferEvent.address;
        const receiverAddress = base64ToBech32(transferEvent.topics[3]);
        if (senderAddress !== receiverAddress) {
          return new AssetHistoryLogInput({
            event: mainEvent,
            action: AssetActionEnum.Received,
            address: receiverAddress,
            itemsCount: transferEvent.topics[2],
            sender: senderAddress,
          });
        }
      }
      case NftEventEnum.ESDTNFTBurn:
      case NftEventEnum.ESDTNFTUpdateAttributes: {
        break;
      }
      default: {
        return this.mapNftEventLog(nonce, transferEvent.identifier, mainEvent);
      }
    }
  }
}
