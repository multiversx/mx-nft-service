export interface AccountIdentity {
  description: string;
  profile: string;
  cover: string;
  herotag: string;
  id: string;
  socialLinks: SocialLink[];
  address: string;
}

export interface SocialLink {
  type: string;
  url: string;
}
