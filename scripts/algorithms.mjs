import { NODE_TYPE } from "./constants.mjs";
import { getDistance, PriorityQueue } from "./utils.mjs";

const computeHTable = (nodes) => {
  const finalNodes = nodes.filter((node) => node.type === NODE_TYPE.FINAL);
  const computeMinDistance = (node, finalNodes) => {
    let distances = finalNodes.map((finalNode) =>
      getDistance(node.position, finalNode.position)
    );

    return Math.min(...distances);
  };

  return nodes.map((node) => computeMinDistance(node, finalNodes));
};

const computePath = (order, lastNodeIdx) => {
  const path = [];
  let idx = lastNodeIdx;

  while (idx !== -1) {
    path.push(idx);
    idx = order[idx];
  }

  return path;
};

export const bfs = (nodes, matrix, originIdx, onDiscover, onVisit, onFind) => {
  const discovered = new Array(nodes.length).fill(0);
  const order = new Array(nodes.length).fill(-1);
  const queue = [originIdx];
  const path = [];
  let iterations = 0;
  let nodeIdx;

  discovered[originIdx] = 1;

  while (queue.length) {
    iterations++;
    nodeIdx = queue.shift();
    onVisit(nodeIdx);

    if (nodes[nodeIdx].type === NODE_TYPE.FINAL) {
      onFind(nodeIdx);
      break;
    }

    for (let idx = 0; idx < matrix.length; idx++) {
      if (matrix[nodeIdx][idx] === 0 || discovered[idx] === 1) continue;

      order[idx] = nodeIdx;
      discovered[idx] = 1;
      onDiscover(idx);
      queue.push(idx);
    }
  }

  return { path: computePath(order, nodeIdx), iterations };
};

export const dfs = (nodes, matrix, originIdx, onDiscover, onVisit, onFind) => {
  const discovered = new Array(nodes.length).fill(0);
  const order = new Array(nodes.length).fill(-1);
  const stack = [originIdx];
  let iterations = 0;
  let nodeIdx;

  discovered[originIdx] = 1;

  while (stack.length) {
    iterations++;
    nodeIdx = stack.pop();
    onVisit(nodeIdx);

    if (nodes[nodeIdx].type === NODE_TYPE.FINAL) {
      onFind(nodeIdx);
      break;
    }

    for (let idx = 0; idx < matrix.length; idx++) {
      if (matrix[nodeIdx][idx] === 0 || discovered[idx] === 1) continue;

      order[idx] = nodeIdx;
      discovered[idx] = 1;
      onDiscover(idx);
      stack.push(idx);
    }
  }

  return { path: computePath(order, nodeIdx), iterations };
};

export const bestFirstSearch = (
  nodes,
  matrix,
  originIdx,
  onDiscover,
  onVisit,
  onFind
) => {
  const discovered = new Array(nodes.length).fill(0);
  const order = new Array(nodes.length).fill(-1);
  const HTable = computeHTable(nodes);
  const priorityQueue = new PriorityQueue([
    { item: originIdx, weight: HTable[originIdx] },
  ]);
  let iterations = 0;
  let nodeIdx;

  discovered[originIdx] = 1;

  while (!priorityQueue.empty()) {
    iterations++;
    nodeIdx = priorityQueue.pop().item;
    onVisit(nodeIdx);

    if (nodes[nodeIdx].type === NODE_TYPE.FINAL) {
      onFind(nodeIdx);
      break;
    }

    for (let idx = 0; idx < matrix.length; idx++) {
      if (matrix[nodeIdx][idx] === 0 || discovered[idx] === 1) continue;

      priorityQueue.add({ item: idx, weight: HTable[idx] });

      order[idx] = nodeIdx;
      discovered[idx] = 1;
      onDiscover(idx);
    }
  }

  return { path: computePath(order, nodeIdx), iterations };
};

export const AStar = (
  nodes,
  matrix,
  originIdx,
  onDiscover,
  onVisit,
  onFind
) => {
  const distance = new Array(nodes.length).fill(-1);
  const order = new Array(nodes.length).fill(-1);
  const HTable = computeHTable(nodes);
  const priorityQueue = new PriorityQueue([
    { item: originIdx, weight: HTable[originIdx] },
  ]);
  let nodeIdx;
  let iterations = 0;

  distance[originIdx] = 0;

  while (!priorityQueue.empty()) {
    iterations++;
    nodeIdx = priorityQueue.pop().item;
    onVisit(nodeIdx);

    if (nodes[nodeIdx].type === NODE_TYPE.FINAL) {
      onFind(nodeIdx);
      break;
    }

    for (let idx = 0; idx < matrix.length; idx++) {
      if (matrix[nodeIdx][idx] === 0 || distance[idx] !== -1) continue;

      distance[idx] =
        distance[nodeIdx] +
        getDistance(nodes[nodeIdx].position, nodes[idx].position);
      order[idx] = nodeIdx;
      onDiscover(idx);

      priorityQueue.add({ item: idx, weight: distance[idx] + HTable[idx] });
    }
  }

  return { path: computePath(order, nodeIdx), iterations };
};
