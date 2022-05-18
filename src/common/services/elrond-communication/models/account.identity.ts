export interface AccountIdentity {
  description: string;
  profile: Profile;
  cover: Cover;
  herotag: string;
  id: string;
  socialLinks: SocialLink[];
  address: string;
  privacy: Privacy;
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
