export interface AccountIdentity {
  description: string;
  profile: Profile;
  cover: Cover;
  herotag: string;
  id: string;
  socialLinks: SocialLink[];
  address: string;
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
