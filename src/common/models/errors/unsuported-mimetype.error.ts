export class UnsuportedMimetypeError extends Error {
  static fromError({ message }: Error) {
    return new UnsuportedMimetypeError(message);
  }
}
