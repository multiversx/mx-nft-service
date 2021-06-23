import { Field, Int, ObjectType } from '@nestjs/graphql';
import { SocialLinkEntity } from 'src/db/socialLinks/social-link.entity';

@ObjectType()
export class SocialLink {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;

  @Field()
  iconName: string;

  constructor(init?: Partial<SocialLink>) {
    Object.assign(this, init);
  }

  static fromEntity(socialLink: SocialLinkEntity) {
    return new SocialLink({
      iconName: socialLink.iconName,
      id: socialLink.id,
      name: socialLink.name,
    });
  }
}
