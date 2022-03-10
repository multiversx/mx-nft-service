declare global {
  interface Array<T> {
    groupBy(predicate: (item: T) => any): any;
    remove(element: T): number;
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

export {};
