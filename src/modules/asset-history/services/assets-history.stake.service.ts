import { Injectable } from '@nestjs/common';
import {
  AssetActionEnum,
  NftEventEnum,
  StakeNftEventsEnum,
} from 'src/modules/assets/models';
import { AssetHistoryInput as AssetHistoryLogInput } from '../models/asset-history-log-input';

@Injectable()
export class AssetsHistoryStakeEventsService {
  constructor() {}

  mapStakeEventLog(
    nonce: string,
    eventType: string,
    mainEvent: any,
  ): AssetHistoryLogInput {
    const encodedNonce = Buffer.from(nonce, 'hex').toString('base64');

    switch (eventType) {
      case StakeNftEventsEnum.Stake: {
        const stakeNftEvent = mainEvent._source.events.find(
          (event) =>
            event.identifier === eventType && event.topics[2] === encodedNonce,
        );
        const stakingAddress = stakeNftEvent.address;

        let quantity;
        const multiEsdtNftTransfer = mainEvent._source.events.find(
          (event) =>
            event.identifier === NftEventEnum.MultiESDTNFTTransfer &&
            event.topics[1] === encodedNonce,
        );
        quantity = multiEsdtNftTransfer
          ? multiEsdtNftTransfer.topics[2]
          : mainEvent._source.events[0].topics[2];

        const senderAddress = multiEsdtNftTransfer
          ? stakeNftEvent.topics[1].base64ToBech32()
          : mainEvent._source.events[1].address;

        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.Staked,
          address: stakingAddress,
          itemsCount: quantity,
          sender: senderAddress,
        });
      }
      case StakeNftEventsEnum.Unstake: {
        const unstakeNftEvent = mainEvent._source.events.find(
          (event) =>
            event.identifier === eventType && event.topics[2] === encodedNonce,
        );
        const stakingAddress = unstakeNftEvent.address;

        let quantity;
        const multiEsdtNftTransfer = mainEvent._source.events.find(
          (event) =>
            event.identifier === NftEventEnum.MultiESDTNFTTransfer &&
            event.topics[1] === encodedNonce,
        );
        quantity = multiEsdtNftTransfer
          ? multiEsdtNftTransfer.topics[2]
          : mainEvent._source.events[1].topics[2];

        const receiverAddress = multiEsdtNftTransfer
          ? unstakeNftEvent.topics[1].base64ToBech32()
          : mainEvent._source.events[1].address;

        return new AssetHistoryLogInput({
          event: mainEvent,
          action: AssetActionEnum.Unstaked,
          address: receiverAddress,
          itemsCount: quantity,
          sender: stakingAddress,
        });
      }
    }
  }
}
