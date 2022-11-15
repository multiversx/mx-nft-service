import {
  ElasticQuery,
  QueryType,
  QueryOperator,
  RangeLowerThanOrEqual,
  RangeGreaterThan,
  ElasticSortOrder,
} from '@elrondnetwork/erdnest';
import { Injectable, Logger } from '@nestjs/common';
import { ElrondElasticService } from 'src/common';
import { NftTypeEnum } from '../assets/models';
import { EncodedNftValues, NftTraits } from './models/nft-traits.model';
import { constants } from 'src/config';

@Injectable()
export class NftTraitsElasticService {
  constructor(
    private readonly elasticService: ElrondElasticService,
    private readonly logger: Logger,
  ) {}

  private buildNftTraitsBulkUpdate(nfts: NftTraits[]): string[] {
    let updates: string[] = [];
    nfts.forEach((nft) => {
      const payload = this.elasticService.buildBulkUpdate<string[]>(
        'tokens',
        nft.identifier,
        'nft_traitValues',
        nft.traits.map((t) => EncodedNftValues.encode(t)),
      );
      updates.push(payload);
    });
    return updates;
  }

  private buildNftEncodedValuesBulkUpdate(
    encodedNftValues: EncodedNftValues[],
  ): string[] {
    let updates: string[] = [];
    encodedNftValues.forEach((nft) => {
      const payload = this.elasticService.buildBulkUpdate<string[]>(
        'tokens',
        nft.identifier,
        'nft_traitValues',
        nft.encodedValues ?? [],
      );
      updates.push(payload);
    });
    return updates;
  }

  async setNftsTraitsInElastic(nfts: NftTraits[]): Promise<void> {
    if (nfts.length > 0) {
      try {
        await this.elasticService.bulkRequest(
          'tokens',
          this.buildNftTraitsBulkUpdate(nfts),
          '?timeout=1m',
        );
      } catch (error) {
        this.logger.error('Error when bulk updating nft traits in Elastic', {
          path: `${NftTraitsElasticService.name}.${this.setNftsTraitsInElastic.name}`,
          exception: error?.message,
        });
      }
    }
  }

  async setNftsValuesInElastic(
    encodedNftValues: EncodedNftValues[],
  ): Promise<void> {
    if (encodedNftValues.length > 0) {
      try {
        await this.elasticService.bulkRequest(
          'tokens',
          this.buildNftEncodedValuesBulkUpdate(encodedNftValues),
          '?timeout=1m',
        );
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
      const query = this.getNftWithTraitValuesFromElasticQuery(identifier);

      await this.elasticService.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (items) => {
          nftValues = items[0]?.nft_traitValues ?? [];
          return undefined;
        },
      );
    } catch (error) {
      this.logger.error(`Error when getting NFT trait values from Elastic`, {
        path: `${NftTraitsElasticService.name}.${this.getNftValuesFromElastic.name}`,
        exception: error?.message,
        identifier: identifier,
      });
    }

    return nftValues;
  }

  async getAllEncodedNftValuesFromElastic(
    collection: string,
    startNonce?: number,
    endNonce?: number,
  ): Promise<EncodedNftValues[]> {
    let encodedNftValues: EncodedNftValues[] = [];

    try {
      const query = this.getAllEncodedNftValuesFromElasticQuery(
        collection,
        startNonce - 1,
        endNonce,
      );

      let maxNonce: number = 0;
      let minNonce: number = Number.POSITIVE_INFINITY;

      await this.elasticService.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (items) => {
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
        },
      );
    } catch (error) {
      this.logger.error(
        `Error when getting all NFT trait values from Elastic`,
        {
          path: `${NftTraitsElasticService.name}.${this.getAllEncodedNftValuesFromElastic.name}`,
          exception: error?.message,
          identifier: collection,
        },
      );
    }

    return encodedNftValues;
  }

  async setCollectionTraitsFlagInElastic(collection: string): Promise<void> {
    try {
      let updates: string[] = [];
      updates.push(
        this.elasticService.buildBulkUpdate<boolean>(
          'tokens',
          collection,
          'nft_hasTraitSummary',
          true,
        ),
      );
      await this.elasticService.bulkRequest('tokens', updates, '?timeout=1m');
    } catch (error) {
      this.logger.error('Error when setting collection traits flag', {
        path: `${NftTraitsElasticService.name}.${this.setCollectionTraitsFlagInElastic.name}`,
        exception: error?.message,
        collection: collection,
      });
    }
  }

  async getAllNftsWithTraitsFromElastic(
    beforeTimestamp: number,
    maxToFetch: number,
  ): Promise<{ [key: string]: string[] }> {
    let dict: { [key: string]: string[] } = {};
    try {
      const query =
        this.getAllEncodedNftValuesFromElasticBeforeTimestampQuery(
          beforeTimestamp,
        );

      await this.elasticService.getScrollableList(
        'tokens',
        'identifier',
        query,
        async (items) => {
          items.map((item) => (dict[item.identifier] = item.nft_traitValues));
        },
        maxToFetch,
      );
    } catch (error) {
      this.logger.error(
        `Error when getting all NFT trait values from Elastic`,
        {
          path: `${NftTraitsElasticService.name}.${this.getAllNftsWithTraitsFromElastic.name}`,
          exception: error?.message,
        },
      );
    }
    return dict;
  }

  getAllEncodedNftValuesFromElasticQuery(
    collection: string,
    startNonce?: number,
    endNonce?: number,
  ): ElasticQuery {
    let query = ElasticQuery.create()
      .withMustExistCondition('nonce')
      .withMustCondition(
        QueryType.Match('token', collection, QueryOperator.AND),
      )
      .withFields(['nft_traitValues', 'nonce'])
      .withMustMultiShouldCondition(
        [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
        (type) => QueryType.Match('type', type),
      )
      .withPagination({
        from: 0,
        size: constants.getNftsFromElasticBatchSize,
      });
    if (startNonce !== undefined && endNonce !== undefined) {
      query = query.withRangeFilter(
        'nonce',
        new RangeGreaterThan(startNonce),
        new RangeLowerThanOrEqual(endNonce),
      );
    }
    return query;
  }

  getAllEncodedNftValuesFromElasticBeforeTimestampQuery(
    beforeTimestamp?: number,
  ): ElasticQuery {
    let query = ElasticQuery.create()
      .withMustExistCondition('nonce')
      .withFields(['nft_traitValues', 'timestamp', 'identifier'])
      .withRangeFilter('timestamp', new RangeLowerThanOrEqual(beforeTimestamp))
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withMustMultiShouldCondition(
        [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
        (type) => QueryType.Match('type', type),
      )
      .withPagination({
        from: 0,
        size: constants.getNftsFromElasticBatchSize,
      });

    return query;
  }

  getAllCollectionsFromElasticQuery(): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('token')
      .withMustNotExistCondition('nonce')
      .withMustMultiShouldCondition(
        [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
        (type) => QueryType.Match('type', type),
      )
      .withPagination({
        from: 0,
        size: constants.getCollectionsFromElasticBatchSize,
      });
  }

  getNftWithTraitValuesFromElasticQuery(identifier: string): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('nonce')
      .withMustCondition(
        QueryType.Match('identifier', identifier, QueryOperator.AND),
      )
      .withFields(['nft_traitValues'])
      .withMustMultiShouldCondition(
        [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
        (type) => QueryType.Match('type', type),
      )
      .withPagination({
        from: 0,
        size: 1,
      });
  }

  getCollectionsWhereTraitsFlagNotSetFromElasticQuery(
    maxCollectionsToUpdate: number,
  ): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('token')
      .withMustNotExistCondition('nonce')
      .withMustNotCondition(QueryType.Match('nft_hasTraitSummary', true))
      .withMustMultiShouldCondition(
        [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
        (type) => QueryType.Match('type', type),
      )
      .withFields(['token'])
      .withPagination({
        from: 0,
        size: Math.min(
          constants.getCollectionsFromElasticBatchSize,
          maxCollectionsToUpdate,
        ),
      });
  }

  getCollectionsWithTraitSummaryFromElasticQuery(
    maxCollectionsToValidate: number,
  ): ElasticQuery {
    return ElasticQuery.create()
      .withMustExistCondition('token')
      .withMustNotExistCondition('nonce')
      .withMustCondition(QueryType.Match('nft_hasTraitSummary', true))
      .withMustMultiShouldCondition(
        [NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT],
        (type) => QueryType.Match('type', type),
      )
      .withPagination({
        from: 0,
        size: Math.min(
          constants.getCollectionsFromElasticBatchSize,
          maxCollectionsToValidate,
        ),
      });
  }
}
