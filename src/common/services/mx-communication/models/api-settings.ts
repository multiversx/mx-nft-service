export class ApiSettings {
  timeout?: number;
  authorization?: string;
  apiKey?: string;
  contentType?: string;

  constructor(init?: Partial<ApiSettings>) {
    Object.assign(this, init);
  }
}
