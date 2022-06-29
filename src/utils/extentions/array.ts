declare global {
  interface Array<T> {
    groupBy(predicate: (item: T) => any): any;
    remove(element: T): number;
    sorted(predicate?: (element: T) => number): T[];
    sortedDescending(predicate?: (element: T) => number): T[];
    toRecord<TOUT>(
      keyPredicate: (item: T) => string,
      valuePredicate?: (item: T) => TOUT,
    ): Record<string, TOUT>;
  }
}

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

Array.prototype.sorted = function <T>(predicate?: (item: T) => number): T[] {
  const cloned = [...this];

  if (predicate) {
    cloned.sort((a, b) => predicate(a) - predicate(b));
  } else {
    cloned.sort((a, b) => a - b);
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
