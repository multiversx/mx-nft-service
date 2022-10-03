import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService, ElrondElasticService } from 'src/common';
import {
  CollectionTraits,
  TraitTypeValues,
} from './models/collection-traits.model';
import { NftTrait, NftTraits } from './models/nft-traits.model';

@Injectable()
export class NftTraitsService {
  constructor(
    private readonly apiService: ElrondApiService,
    private readonly elasticService: ElrondElasticService,
    private readonly logger: Logger,
  ) {}

  async updateTraits(collectionTicker: string): Promise<boolean> {
    const allNfts: NftTraits[] = await this.getAllCollectionNftsFromAPI(
      collectionTicker,
    );

    if (allNfts?.length === 0) {
      return false;
    }

    const [collectionTraits, nftsTraits] = this.getTraitsFromNfts(
      collectionTicker,
      allNfts,
    );

    await Promise.all([
      this.setCollectionTraitTypesInElastic(collectionTraits),
      this.setNftsTraitsInElastic(nftsTraits),
    ]);

    return true;
  }

  private getTraitsFromNfts(
    collectionTicker: string,
    nfts: NftTraits[],
  ): [CollectionTraits, NftTraits[]] {
    let collectionTraits: CollectionTraits = new CollectionTraits({
      identifier: collectionTicker,
      traits: [],
    });
    let nftsTraits: NftTraits[] = [];

    for (const nft of nfts) {
      let nftTraits: NftTraits = new NftTraits({
        identifier: nft.identifier,
        traits: [],
      });

      for (const [key, value] of Object.entries(nft.metadata.attributes)) {
        if (value.trait_type === undefined || value.value === undefined) {
          continue;
        }

        const traitName = String(value.trait_type);
        const traitValue = String(value.value);

        nftTraits.traits.push(
          new NftTrait({
            name: traitName,
            value: traitValue,
          }),
        );

        let traitTypeValues: TraitTypeValues = collectionTraits.traits.find(
          (t) => t.name === traitName,
        );

        if (traitTypeValues) {
          let value = traitTypeValues.values.find((v) => v === traitValue);
          if (!value) {
            traitTypeValues.values.push(traitValue);
          }
        } else {
          collectionTraits.traits.push(
            new TraitTypeValues({
              name: traitName,
              values: [traitValue.toString()],
            }),
          );
        }
      }

      nftsTraits.push(nftTraits);
    }

    return [collectionTraits, nftsTraits];
  }

  private async setCollectionTraitTypesInElastic(
    collection: CollectionTraits,
  ): Promise<void> {
    try {
      const updateBody = this.elasticService.buildUpdateBody<TraitTypeValues[]>(
        'nft_traitTypes',
        collection.traits,
      );
      console.log(JSON.stringify(updateBody));
      await this.elasticService.setCustomValue(
        'tokens',
        collection.identifier,
        updateBody,
        '?retry_on_conflict=2&timeout=1m',
      );
    } catch (error) {
      this.logger.error('Error when setting collection trait types', {
        path: 'NftRarityService.setCollectionTraitTypesInElastic',
        exception: error?.message,
        collection: collection.identifier,
      });
    }
  }

  private buildNftTraitsBulkUpdate(nfts: NftTraits[]): string[] {
    let updates: string[] = [];
    nfts.forEach((nft) => {
      updates.push(
        this.elasticService.buildBulkUpdate<NftTrait[]>(
          'tokens',
          nft.identifier,
          'nft_traits',
          nft.traits,
        ),
      );
    });
    return updates;
  }

  private async setNftsTraitsInElastic(nfts: NftTraits[]): Promise<void> {
    if (nfts.length > 0) {
      try {
        await this.elasticService.bulkRequest(
          'tokens',
          this.buildNftTraitsBulkUpdate(nfts),
          '?timeout=1m',
        );
      } catch (error) {
        this.logger.error('Error when bulk updating nft traits in Elastic', {
          path: 'NftRarityService.setNftsTraitsInElastic',
          exception: error?.message,
        });
      }
    }
  }

  private async getAllCollectionNftsFromAPI(
    collectionTicker: string,
  ): Promise<NftTraits[]> {
    try {
      const res = await this.apiService.getAllNftsByCollection(
        collectionTicker,
        'identifier,nonce,metadata,score,rank,timestamp',
      );
      return res.map((nft) => NftTraits.fromNft(nft));
    } catch (error) {
      this.logger.error(`Error when getting all collection NFTs from API`, {
        path: 'NftRarityService.getAllCollectionNftsFromAPI',
        exception: error?.message,
        collection: collectionTicker,
      });
      return [];
    }
  }
}
