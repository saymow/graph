import * as algorithms from "./algorithms.mjs";

export const getAll = () => {
  return [
    { id: "dfs", name: "Depth First Search (DFS)", handle: algorithms.dfs },
    { id: "bfs", name: "Breadth First Search (BFS)", handle: algorithms.bfs },
    {
      id: "best-first-search",
      name: "Best First Search",
      handle: algorithms.bestFirstSearch,
    },
  ];
};

export const makeAlgorithm = (id) => {
  return getAll().find((item) => item.id === id);
};