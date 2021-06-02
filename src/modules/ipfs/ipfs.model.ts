export class UploadToIpfsResult {
  hash: string;
  url: string;

  constructor(init?: Partial<UploadToIpfsResult>) {
    Object.assign(this, init);
  }
}
