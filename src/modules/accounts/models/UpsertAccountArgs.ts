import { Field, InputType, Int } from '@nestjs/graphql';
import { FileUpload } from 'graphql-upload';

@InputType()
export class UpsertAccountArgs {
  @Field()
  address: string;
  @Field({ nullable: true })
  description: string;
  @Field(() => [Int], { nullable: true })
  socialLinkIds: number[];

  avatarFile: FileUpload;
  coverFile: FileUpload;
}
