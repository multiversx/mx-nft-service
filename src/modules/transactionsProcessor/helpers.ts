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
