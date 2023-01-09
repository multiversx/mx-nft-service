export class AccountIdentity {
  description: string;
  profile: Profile;
  cover: Cover;
  herotag: string;
  id: string;
  socialLinks: SocialLink[];
  address: string;
  privacy: Privacy;

  constructor(init?: Partial<AccountIdentity>) {
    Object.assign(this, init);
  }
}

export interface SocialLink {
  type: string;
  url: string;
}

export interface Cover {
  url: string;
}

export interface Profile {
  url: string;
}

export enum Privacy {
  public = 'public',
  private = 'private',
}
