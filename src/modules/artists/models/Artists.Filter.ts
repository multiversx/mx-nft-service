import { Field, InputType } from '@nestjs/graphql';
import { ArtistSortingEnum } from './Artist-Sorting.enum';

@InputType()
export class ArtistFilters {
  @Field(() => ArtistSortingEnum)
  sorting: ArtistSortingEnum;

  constructor(init?: Partial<ArtistFilters>) {
    Object.assign(this, init);
  }
}
