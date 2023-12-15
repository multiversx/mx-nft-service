import { NftTypeEnum } from 'src/modules/assets/models';
import { ElasticQuery, MatchQuery, QueryType } from '@multiversx/sdk-nestjs-elastic';
import { constants } from 'src/config';
import { ELASTIC_NFT_NSFW } from 'src/utils/constants';

export const getNsfwNotMarkedQuery = ElasticQuery.create()
  .withMustNotExistCondition(ELASTIC_NFT_NSFW)
  .withMustExistCondition('identifier')
  .withMustMultiShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT], (type) => QueryType.Match('type', type))
  .withMustCondition(QueryType.Nested('data', [new MatchQuery('data.nonEmptyURIs', true)]))
  .withPagination({ from: 0, size: constants.elasticMaxBatch });

export const getNsfwMarkedQuery = ElasticQuery.create()
  .withFields([ELASTIC_NFT_NSFW])
  .withMustExistCondition('identifier')
  .withMustMultiShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT], (type) => QueryType.Match('type', type))
  .withMustCondition(QueryType.Nested('data', [new MatchQuery('data.nonEmptyURIs', true)]))
  .withPagination({ from: 0, size: constants.elasticMaxBatch });
