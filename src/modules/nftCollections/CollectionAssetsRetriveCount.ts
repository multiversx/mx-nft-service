import { Int, InputType, Field } from '@nestjs/graphql';
import { IsOptional, Max, Min } from 'class-validator';

@InputType()
export class CollectionAssetsRetriveCount {
  @Field(() => Int)
  @IsOptional()
  @Min(1)
  @Max(10)
  @Field(() => Int)
  size: number = 4;
}
