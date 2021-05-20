export class UploadFileResult {
  hash: string;
  url: string;

  constructor(init?: Partial<UploadFileResult>) {
    Object.assign(this, init);
  }
}