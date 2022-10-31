declare global {
  interface Array<T> {
    groupBy(predicate: (item: T) => any, asArray?: boolean): any;
    remove(element: T): number;
    sorted(predicate?: (element: T) => number, ignoreZeros?: boolean): T[];
    sortedDescending(predicate?: (element: T) => number): T[];
    sum(predicate?: (item: T) => number): number;
    toRecord<TOUT>(
      keyPredicate: (item: T) => string,
      valuePredicate?: (item: T) => TOUT,
    ): Record<string, TOUT>;
    distinct<TResult>(predicate?: (element: T) => TResult): T[];
  }
}

Array.prototype.distinct = function <TCollection, TResult>(
  predicate?: (element: TCollection) => TResult,
): TCollection[] {
  if (!predicate) {
    // @ts-ignore
    return [...new Set(this)];
  }

  const distinctProjections: TResult[] = [];
  const result: TCollection[] = [];

  for (const element of this) {
    const projection = predicate(element);
    if (!distinctProjections.includes(projection)) {
      distinctProjections.push(projection);
      result.push(element);
    }
  }

  return result;
};

Array.prototype.groupBy = function (predicate: Function, asArray = false) {
  let result = this.reduce(function (rv, x) {
    (rv[predicate(x)] = rv[predicate(x)] || []).push(x);
    return rv;
  }, {});

  if (asArray === true) {
    result = Object.keys(result).map((key) => {
      return {
        key: key,
        values: result[key],
      };
    });
  }

  return result;
};

Array.prototype.remove = function <T>(element: T): number {
  const index = this.indexOf(element);
  if (index >= 0) {
    this.splice(index, 1);
  }

  return index;
};

Array.prototype.sorted = function <T>(
  predicate?: (item: T) => number,
  ignoreZeros: boolean = false,
): T[] {
  const cloned = [...this];

  if (predicate) {
    cloned.sort((a, b) => {
      if (ignoreZeros) {
        const x = predicate(a) === 0 ? Infinity : predicate(a);
        const y = predicate(b) === 0 ? Infinity : predicate(b);

        return x - y;
      }
      return predicate(a) - predicate(b);
    });
  } else {
    cloned.sort((a, b) => {
      if (ignoreZeros) {
        const x = a === 0 ? Infinity : a;
        const y = b === 0 ? Infinity : b;
        return x - y;
      }
      return a - b;
    });
  }

  return cloned;
};

Array.prototype.sortedDescending = function <T>(
  predicate?: (item: T) => number,
): T[] {
  const sorted = this.sorted(predicate);

  sorted.reverse();

  return sorted;
};

Array.prototype.sum = function <T>(predicate?: (item: T) => number): number {
  if (predicate) {
    return this.map(predicate).reduce((a, b) => a + b);
  }

  return this.reduce((a, b) => a + b);
};

Array.prototype.toRecord = function <TIN, TOUT>(
  keyPredicate: (item: TIN) => string,
  valuePredicate?: (item: TIN) => TOUT,
): Record<string, TOUT> {
  const result: Record<string, TOUT> = {};

  for (const item of this) {
    result[keyPredicate(item)] = valuePredicate ? valuePredicate(item) : item;
  }

  return result;
};

export {};
