export interface ScamInfoApi {
  type: ScamInfoTypeApiEnum;
  info: string;
}

export enum ScamInfoTypeApiEnum {
  scam = 'scam',
  potentialScam = 'potentialScam',
}
