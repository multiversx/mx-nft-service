export class InapropriateContentError extends Error {
  static fromError({ message }: Error) {
    return new InapropriateContentError(message);
  }
}
