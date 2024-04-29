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

    if (nodes[nodeIdx].type === "final") {
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