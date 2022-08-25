export class UnableToLoadError extends Error {
  static fromError({ message }: Error) {
    return new UnableToLoadError(message);
  }
}
