export class FileContent {
  description: string;
  fileUri: string;
  fileType: string;
  fileName: string;
  constructor(init?: Partial<FileContent>) {
    Object.assign(this, init);
  }
}
