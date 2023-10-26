import { Injectable, Logger } from '@nestjs/common';
import { MxElasticService } from 'src/common';
import { CollectionWithTraitsFlag } from './models/collection-with-traits-flag.model';
import { EncodedNftValues, NftTraits } from './models/nft-traits.model';
import {
  getAllCollectionsFromElasticQuery,
  getAllCollectionsWithTraitsFlagFromElasticQuery,
  getAllEncodedNftValuesFromElasticBeforeTimestampQuery,
  getAllEncodedNftValuesFromElasticQuery,
  getNftWithTraitValuesFromElasticQuery,
} from './nft-traits.elastic.queries';
import { ELASTIC_NFT_HASTRAITSUMMARY, ELASTIC_NFT_TRAITS, ELASTIC_TOKENS_INDEX } from 'src/utils/constants';

@Injectable()
export class NftTraitsElasticService {
  constructor(private readonly elasticService: MxElasticService, private readonly logger: Logger) {}

  async setNftsTraitsInElastic(nfts: NftTraits[]): Promise<void> {
    if (nfts.length > 0) {
      try {
        await this.elasticService.bulkRequest(ELASTIC_TOKENS_INDEX, this.buildNftTraitsBulkUpdate(nfts), '?timeout=1m');
      } catch (error) {
        this.logger.error('Error when bulk updating nft traits in Elastic', {
          path: `${NftTraitsElasticService.name}.${this.setNftsTraitsInElastic.name}`,
          exception: error?.message,
        });
      }
    }
  }

  async setNftsValuesInElastic(encodedNftValues: EncodedNftValues[]): Promise<void> {
    if (encodedNftValues.length > 0) {
      try {
        await this.elasticService.bulkRequest(ELASTIC_TOKENS_INDEX, this.buildNftEncodedValuesBulkUpdate(encodedNftValues), '?timeout=1m');
      } catch (error) {
        this.logger.error('Error when bulk updating nft traits in Elastic', {
          path: `${NftTraitsElasticService.name}.${this.setNftsValuesInElastic.name}`,
          exception: error?.message,
        });
      }
    }
  }

  async getNftValuesFromElastic(identifier: string): Promise<string[]> {
    let nftValues: string[] = [];

    try {
      const query = getNftWithTraitValuesFromElasticQuery(identifier);

      await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'identifier', query, async (items) => {
        nftValues = items[0]?.nft_traitValues ?? [];
        return undefined;
      });
    } catch (error) {
      this.logger.error(`Error when getting NFT trait values from Elastic`, {
        path: `${NftTraitsElasticService.name}.${this.getNftValuesFromElastic.name}`,
        exception: error?.message,
        identifier: identifier,
      });
    }

    return nftValues;
  }

  async getAllEncodedNftValuesFromElastic(collection: string, startNonce?: number, endNonce?: number): Promise<EncodedNftValues[]> {
    let encodedNftValues: EncodedNftValues[] = [];

    try {
      const query = getAllEncodedNftValuesFromElasticQuery(collection, startNonce - 1, endNonce);

      let maxNonce: number = 0;
      let minNonce: number = Number.POSITIVE_INFINITY;

      await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'identifier', query, async (items) => {
        const nonces: number[] = items.map((nft) => Number(nft.nonce));
        maxNonce = Math.max(...nonces.concat([maxNonce]));
        minNonce = Math.min(...nonces.concat([maxNonce]));
        encodedNftValues.push(
          ...new Set(
            items.map(
              (item) =>
                new EncodedNftValues({
                  identifier: item.identifier,
                  encodedValues: item.nft_traitValues ?? [],
                }),
            ),
          ),
        );
      });
    } catch (error) {
      this.logger.error(`Error when getting all NFT trait values from Elastic`, {
        path: `${NftTraitsElasticService.name}.${this.getAllEncodedNftValuesFromElastic.name}`,
        exception: error?.message,
        identifier: collection,
      });
    }

    return encodedNftValues;
  }

  async setCollectionTraitsFlagInElastic(collection: string): Promise<void> {
    try {
      let updates: string[] = [];
      updates.push(this.elasticService.buildBulkUpdate<boolean>(ELASTIC_TOKENS_INDEX, collection, ELASTIC_NFT_HASTRAITSUMMARY, true));
      await this.elasticService.bulkRequest(ELASTIC_TOKENS_INDEX, updates, '?timeout=1m');
    } catch (error) {
      this.logger.error('Error when setting collection traits flag', {
        path: `${NftTraitsElasticService.name}.${this.setCollectionTraitsFlagInElastic.name}`,
        exception: error?.message,
        collection: collection,
      });
    }
  }

  async getAllNftsWithTraitsFromElastic(beforeTimestamp: number, maxToFetch: number): Promise<{ [key: string]: string[] }> {
    let dict: { [key: string]: string[] } = {};
    try {
      const query = getAllEncodedNftValuesFromElasticBeforeTimestampQuery(beforeTimestamp);

      await this.elasticService.getScrollableList(
        ELASTIC_TOKENS_INDEX,
        'identifier',
        query,
        async (items) => {
          items.map((item) => (dict[item.identifier] = item.nft_traitValues));
        },
        maxToFetch,
      );
    } catch (error) {
      this.logger.error(`Error when getting all NFT trait values from Elastic`, {
        path: `${NftTraitsElasticService.name}.${this.getAllNftsWithTraitsFromElastic.name}`,
        exception: error?.message,
      });
    }
    return dict;
  }

  async getAllCollectionsFromElastic(): Promise<string[]> {
    const query = getAllCollectionsFromElasticQuery();
    let collections: string[] = [];
    await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'token', query, async (items) => {
      collections = collections.concat([...new Set(items.map((i) => i.token))]);
    });
    return collections;
  }

  async getAllCollectionsWithTraitsFlagFromElastic(): Promise<CollectionWithTraitsFlag[]> {
    const query = getAllCollectionsWithTraitsFlagFromElasticQuery();
    let collections: CollectionWithTraitsFlag[] = [];
    await this.elasticService.getScrollableList(ELASTIC_TOKENS_INDEX, 'token', query, async (items) => {
      collections = collections.concat([
        ...new Set(
          items.map(
            (i) =>
              new CollectionWithTraitsFlag({
                identifier: i.token,
                hasTraitsFlagSet: i.nft_hasTraitSummary,
              }),
          ),
        ),
      ]);
    });
    return collections;
  }

  private buildNftTraitsBulkUpdate(nfts: NftTraits[]): string[] {
    let updates: string[] = [];
    nfts.forEach((nft) => {
      const payload = this.elasticService.buildBulkUpdate<string[]>(
        ELASTIC_TOKENS_INDEX,
        nft.identifier,
        ELASTIC_NFT_TRAITS,
        nft.traits.map((t) => EncodedNftValues.encode(t)),
      );
      updates.push(payload);
    });
    return updates;
  }

  private buildNftEncodedValuesBulkUpdate(encodedNftValues: EncodedNftValues[]): string[] {
    let updates: string[] = [];
    encodedNftValues.forEach((nft) => {
      const payload = this.elasticService.buildBulkUpdate<string[]>(
        ELASTIC_TOKENS_INDEX,
        nft.identifier,
        ELASTIC_NFT_TRAITS,
        nft.encodedValues ?? [],
      );
      updates.push(payload);
    });
    return updates;
  }
}
