import { NODE_TYPE } from "./constants.mjs";
import { computePathDistance, getDistance, PriorityQueue } from "./utils.mjs";

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
  if (lastNodeIdx === -1) return [];

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

export const dijkstra = (
  nodes,
  matrix,
  originIdx,
  onDiscover,
  onVisit,
  onFind
) => {
  const visited = new Array(nodes.length).fill(0);
  const discovered = new Array(nodes.length).fill(0);
  const order = new Array(nodes.length).fill(-1);
  const priorityQueue = new PriorityQueue([{ item: originIdx, weight: 0 }]);
  let iterations = 0;
  let currentNodeIdx;

  visited[originIdx] = 1;

  while (!priorityQueue.empty()) {
    iterations++;
    const currentNode = priorityQueue.pop();
    currentNodeIdx = currentNode.item;

    onVisit(currentNodeIdx);

    if (nodes[currentNodeIdx].type === NODE_TYPE.FINAL) {
      onFind(currentNodeIdx);
      break;
    }

    for (let idx = 0; idx < matrix.length; idx++) {
      if (matrix[currentNodeIdx][idx] === 0 || visited[idx] === 1) continue;

      const weight =
        currentNode.weight +
        getDistance(nodes[currentNodeIdx].position, nodes[idx].position);

      if (discovered[idx] === 0) {
        priorityQueue.add({ item: idx, weight });

        discovered[idx] = 1;
        onDiscover(idx);
        order[idx] = currentNodeIdx;
      } else if (priorityQueue.setMinWeight(idx, weight)) {
        order[idx] = currentNodeIdx;
      }
    }

    visited[currentNodeIdx] = 1;
  }

  return { path: computePath(order, currentNodeIdx), iterations };
};

export const bellmanFord = (
  nodes,
  matrix,
  originIdx,
  onDiscover,
  onVisit,
  onFind
) => {
  const discovered = new Array(nodes.length).fill(0);
  const order = new Array(nodes.length).fill(-1);
  const distances = new Array(nodes.length).fill(Infinity);
  let iterations = 0;

  distances[originIdx] = 0;
  discovered[originIdx] = 1;
  onDiscover(originIdx);

  for (const node of matrix) {
    let distanceUpdated = false;

    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix.length; j++) {
        if (matrix[i][j] === 1) {
          iterations++;

          const distance =
            distances[i] + getDistance(nodes[i].position, nodes[j].position);

          if (distance < distances[j]) {
            distanceUpdated = true;
            distances[j] = distance;
            order[j] = i;
          }
          if (discovered[j] === 0) {
            discovered[j] = 1;
            onDiscover(j);
          }
        }
      }
    }

    if (!distanceUpdated) break;
  }

  let finalNodeIdx = -1;
  let finalNodeDistance = Infinity;

  for (let idx = 0; idx < nodes.length; idx++) {
    if (nodes[idx].type === NODE_TYPE.FINAL) {
      const path = computePath(order, idx);

      if (path.length && path[path.length - 1] === originIdx) {
        const distance = computePathDistance(path.map((i) => nodes[i]));

        onFind(idx);

        if (distance < finalNodeDistance) {
          finalNodeIdx = idx;
          finalNodeDistance = distance;
        }
      }
    }
  }

  return { path: computePath(order, finalNodeIdx), iterations };
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
