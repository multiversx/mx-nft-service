export class FileContent {
  description: string;
  constructor(init?: Partial<FileContent>) {
    Object.assign(this, init);
  }
}
