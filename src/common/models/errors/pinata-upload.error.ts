export class PinataUploadError extends Error {
  static fromError({ message }: Error) {
    return new PinataUploadError(message);
  }
}
