import { ElasticQuery, QueryType, QueryOperator } from '@multiversx/sdk-nestjs-elastic';
import { constants, elasticDictionary } from 'src/config';
import { NftTypeEnum } from '../assets/models';

export const getNftWithScamInfoFromElasticQuery = (identifier: string): ElasticQuery => {
  return ElasticQuery.create()
    .withMustExistCondition('nonce')
    .withMustCondition(QueryType.Match('identifier', identifier, QueryOperator.AND))
    .withFields(['identifier', elasticDictionary.scamInfo.typeKey, elasticDictionary.scamInfo.infoKey])
    .withPagination({
      from: 0,
      size: 1,
    });
};

export const getAllCollectionsFromElasticQuery = (): ElasticQuery => {
  return ElasticQuery.create()
    .withMustExistCondition('token')
    .withMustNotExistCondition('nonce')
    .withMustMultiShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT], (type) => QueryType.Match('type', type))
    .withFields(['token'])
    .withPagination({
      from: 0,
      size: constants.getCollectionsFromElasticBatchSize,
    });
};

export const getCollectionNftsQuery = (collection: string): ElasticQuery => {
  return ElasticQuery.create()
    .withMustExistCondition('nonce')
    .withMustCondition(QueryType.Match('token', collection, QueryOperator.AND))
    .withMustMultiShouldCondition([NftTypeEnum.NonFungibleESDT, NftTypeEnum.SemiFungibleESDT], (type) => QueryType.Match('type', type))
    .withFields(['identifier', elasticDictionary.scamInfo.typeKey, elasticDictionary.scamInfo.infoKey])
    .withPagination({
      from: 0,
      size: constants.getNftsForScamInfoBatchSize,
    });
};
