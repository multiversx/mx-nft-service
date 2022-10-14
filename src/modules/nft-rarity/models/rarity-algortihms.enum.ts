//import { registerEnumType } from '@nestjs/graphql';

export enum RarityAlgorithmsEnum {
  OpenRarity = 'OpenRarity',
  JaccardDistances = 'JaccardDistances',
  TraitRarity = 'TraitRarity',
  StatisticalRarity = 'StatisticalRarity',
}

// registerEnumType(RarityAlgorithmsEnum, {
//   name: 'RarityAlgorithmsEnum',
// });
