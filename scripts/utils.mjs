export const getDistance = (posA, posB) => {
  const [a_x, a_y] = posA;
  const [b_x, b_y] = posB;

  return Math.sqrt((a_x - b_x) ** 2 + (a_y - b_y) ** 2);
};

export const isWithin = (rect, pos) => {
  const [a_x, a_y] = rect[0];
  const [b_x, b_y] = rect[1];
  const [x, y] = pos;

  return a_x <= x && b_x >= x && a_y <= y && b_y >= y;
};

export const computePathDistance = (path) => {
  let distance = 0;

  for (let idx = 1; idx < path.length; idx++) {
    distance += getDistance(path[idx - 1].position, path[idx].position);
  }

  return distance;
};

export const swap = (arr, i, j) => {
  let tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
};

export class PriorityQueue {
  /** @typedef {{ item: any, weight: number }} Item */

  /**@type {Item[]} */
  #items = [];

  /** @arg {Item[]} initialItems */
  constructor(initialItems) {
    this.#items = initialItems;
  }

  /** @arg {Item} item */
  add(item) {
    let i = 0;

    while (i < this.#items.length && this.#items[i].weight > item.weight) {
      i++;
    }

    for (let j = this.#items.length; j > i; j--) {
      swap(this.#items, j, j - 1);
    }

    this.#items[i] = item;
  }

  /** @return {Item|null}  */
  pop() {
    if (this.empty()) return null;
    return this.#items.pop();
  }

  /** @return {boolean}  */
  empty() {
    return this.#items.length === 0;
  }
}
