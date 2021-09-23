export function oneSecond(): number {
  return 1;
}

export function oneMinute(): number {
  return oneSecond() * 60;
}

export function oneHour(): number {
  return oneMinute() * 60;
}

export function oneDay(): number {
  return oneHour() * 24;
}

export function oneWeek(): number {
  return oneDay() * 7;
}

export function getCollectionAndNonceFromIdentifier(identifier: string): {
  collection: string;
  nonce: string;
} {
  const collection = identifier.split('-').slice(0, 2).join('-');
  const nonce = identifier.split('-').slice(2).join('-');
  return { collection, nonce };
}
