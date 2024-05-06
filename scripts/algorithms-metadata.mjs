import * as algorithms from "./algorithms.mjs";
import {
  avgDistance,
  maxDistance,
  minDistance,
  sumDistance,
} from "./utils.mjs";

export const getAll = () => {
  return [
    { id: "dfs", name: "Depth First Search (DFS)", handle: algorithms.dfs },
    { id: "bfs", name: "Breadth First Search (BFS)", handle: algorithms.bfs },
    {
      id: "dijkstra-algorithm",
      name: "Dijkstra's Algorithm",
      handle: algorithms.dijkstra,
    },
    {
      id: "bellman-ford-algorithm",
      name: "Bellman-Ford Algorithm",
      handle: algorithms.bellmanFord,
    },
    {
      id: "best-first-search-hmin",
      name: "Best First Search | h(n) = min(distance)",
      handle: algorithms.bestFirstSearch(minDistance),
    },
    {
      id: "best-first-search-hmax",
      name: "Best First Search | h(n) = max(distance)",
      handle: algorithms.bestFirstSearch(maxDistance),
    },
    {
      id: "best-first-search-havg",
      name: "Best First Search | h(n) = avg(distance)",
      handle: algorithms.bestFirstSearch(avgDistance),
    },
    {
      id: "best-first-search-hsum",
      name: "Best First Search | h(n) = ∑(distance)",
      handle: algorithms.bestFirstSearch(sumDistance),
    },
    {
      id: "a-star-havg",
      name: "A* | h(n) = avg(distance)",
      handle: algorithms.AStar(avgDistance),
    },
    {
      id: "a-star-hsum",
      name: "A* | h(n) = ∑(distance)",
      handle: algorithms.AStar(sumDistance),
    },
    {
      id: "a-star-hmin",
      name: "A* | h(n) = min(distance)",
      handle: algorithms.AStar(minDistance),
    },
    {
      id: "a-star-hmax",
      name: "A* | h(n) = max(distance)",
      handle: algorithms.AStar(maxDistance),
    },
  ];
};

export const makeAlgorithm = (id) => {
  return getAll().find((item) => item.id === id);
};
