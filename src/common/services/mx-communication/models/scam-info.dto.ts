export interface ScamInfoApi {
  type: ScamInfoTypeApiEnum;
  info: string;
}

export enum ScamInfoTypeApiEnum {
  none = 'none',
  scam = 'scam',
  potentialScam = 'potentialScam',
}
