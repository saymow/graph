import { NODE_TYPE } from "./constants.mjs";
import { getDistance, swap } from "./utils.mjs";

export const makeAlgorithm = (algorithName) => {
  if (algorithName === "bfs") {
    return bfs;
  } else if (algorithName === "dfs") {
    return dfs;
  } else if (algorithName === "best-first-search") {
    return best_first_search;
  }

  return null;
};

export const bfs = (nodes, matrix, originIdx, onDiscover, onVisit, onFind) => {
  const discovered = new Array(nodes.length).fill(0);
  const order = new Array(nodes.length).fill(-1);
  const queue = [originIdx];
  const path = [];
  let nodeIdx;

  discovered[originIdx] = 1;

  while (queue.length) {
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

  let idx = nodeIdx;

  while (idx !== -1) {
    path.push(idx);
    idx = order[idx];
  }

  return path;
};

export const dfs = (nodes, matrix, originIdx, onDiscover, onVisit, onFind) => {
  const discovered = new Array(nodes.length).fill(0);
  const order = new Array(nodes.length).fill(-1);
  const stack = [originIdx];
  const path = [];
  let nodeIdx;

  discovered[originIdx] = 1;

  while (stack.length) {
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

  let idx = nodeIdx;

  while (idx !== -1) {
    path.push(idx);
    idx = order[idx];
  }

  return path;
};

const computueMinDistance = (node, finalNodes) => {
  let distances = finalNodes.map((finalNode) =>
    getDistance(node.pos, finalNode.pos)
  );

  return Math.min(...distances);
};

export const best_first_search = (
  nodes,
  matrix,
  originIdx,
  onDiscover,
  onVisit,
  onFind
) => {
  const discovered = new Array(nodes.length).fill(0);
  const order = new Array(nodes.length).fill(-1);
  const finalNodes = nodes.filter((node) => node.type === NODE_TYPE.FINAL);
  const priorityQueue = [[originIdx, computueMinDistance(nodes[originIdx], finalNodes)]];
  let priorityQueueLen = 1;
  const path = [];
  let nodeIdx;

  discovered[originIdx] = 1;

  while (priorityQueueLen > 0) {
    nodeIdx = priorityQueue.shift()[0];
    priorityQueueLen--;
    onVisit(nodeIdx);

    if (nodes[nodeIdx].type === NODE_TYPE.FINAL) {
      onFind(nodeIdx);
      break;
    }

    for (let idx = 0; idx < matrix.length; idx++) {
      if (matrix[nodeIdx][idx] === 0 || discovered[idx] === 1) continue;

      let distances = finalNodes.map((finalNode) =>
        getDistance(nodes[idx].pos, finalNode.pos)
      );
      let minDistance = Math.min(...distances);
      let i = 0;

      while (i < priorityQueueLen && priorityQueue[i][1] < minDistance) {
        i++;
      }

      for (let j = priorityQueueLen; j > i; j--) {
        swap(priorityQueue, j, j - 1);
      }

      priorityQueue[i] = [idx, minDistance];
      priorityQueueLen++;

      order[idx] = nodeIdx;
      discovered[idx] = 1;
      onDiscover(idx);
    }
  }

  let idx = nodeIdx;

  while (idx !== -1) {
    path.push(idx);
    idx = order[idx];
  }

  return path;
};
