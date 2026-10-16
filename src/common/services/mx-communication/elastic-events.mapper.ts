import { BinaryUtils } from '@multiversx/sdk-nestjs-common';

/**
 * Maps flat documents from the `events` index (hex encoded topics/data) to the legacy `logs` index shape
 * (one document per transaction, with an `events` array and base64 encoded topics/data),
 * so that existing consumers and persisted marketplace events keep the same format.
 */
export class ElasticEventsMapper {
  static toLogs(events: any[]): any[] {
    const logs = new Map<string, any>();

    for (const event of events ?? []) {
      let log = logs.get(event.txHash);
      if (!log) {
        log = {
          identifier: event.txHash,
          originalTxHash: event.originalTxHash,
          address: event.logAddress,
          timestamp: event.timestamp,
          events: [],
        };
        logs.set(event.txHash, log);
      }

      log.events.push(ElasticEventsMapper.toLogEvent(event));
    }

    for (const log of logs.values()) {
      log.events.sort((a: any, b: any) => a.order - b.order);
    }

    return [...logs.values()];
  }

  private static toLogEvent(event: any): any {
    return {
      address: event.address,
      identifier: event.identifier,
      topics: event.topics?.map((topic: string) => BinaryUtils.hexToBase64(topic ?? '')) ?? [],
      data: event.data ? BinaryUtils.hexToBase64(event.data) : undefined,
      additionalData: event.additionalData?.map((data: string) => BinaryUtils.hexToBase64(data ?? '')),
      order: event.order,
    };
  }
}
