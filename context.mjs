import { MODE, SPECIAL_NODE_RADIUS } from "./constants.mjs";
import { isWithin } from "./utils.mjs";

const containerEl = document.querySelector("#app");
const sandboxBtnEl = document.querySelector("#sandbox-btn");
const saveBtnEl = document.querySelector("#save-btn");
const loadBtnEl = document.querySelector("#load-btn");
const runBtnEl = document.querySelector("#run-btn");
const clearBtnEl = document.querySelector("#clear-btn");
const comparissonsBtnEl = document.querySelector("#comparissons-btn");
const canvasEl = document.querySelector("canvas");
const algorithmsModalContainerEl = document.querySelector(
  "#algorithm-modal-container"
);
const algorithmsModalEl = document.querySelector("#algorithm-modal");
const resultModalContainerEl = document.querySelector(
  "#result-modal-container"
);
const resultModalEl = document.querySelector("#result-modal");
const comparissonModalContainerEl = document.querySelector(
  "#algorithm-comparissons-modal-container"
);
const comparissonModalEl = document.querySelector(
  "#algorithm-comparissons-modal"
);
const canvasCtx = canvasEl.getContext("2d");

const $algorithmPresentation = new rxjs.Subject();
const $click = new rxjs.Subject();
const $graph = new rxjs.BehaviorSubject({ matrix: [], nodes: [] });
const $mode = new rxjs.BehaviorSubject(MODE.SANDBOX);
const $originNode = new rxjs.BehaviorSubject();
const $algorithm = new rxjs.BehaviorSubject();

export function addNode(node) {
  $graph.pipe(rxjs.operators.take(1)).subscribe((graph) => {
    graph.nodes.push(node);

    for (const row of graph.matrix) {
      row.push(0);
    }

    graph.matrix.push(Array(graph.matrix.length + 1).fill(0));

    $graph.next(graph);
  });
}

export function addEdge(edge) {
  $graph.pipe(rxjs.operators.take(1)).subscribe((graph) => {
    const [origin_node, target_node] = edge;

    graph.matrix[origin_node][target_node] = 1;
    graph.matrix[target_node][origin_node] = 1;

    $graph.next(graph);
  });
}

export function getNode(position) {
  return $graph.pipe(
    rxjs.operators.take(1),
    rxjs.operators.map((graph) =>
      graph.nodes.findIndex((node) => {
        const [x, y] = node.pos;

        return isWithin(
          [
            [x - SPECIAL_NODE_RADIUS, y - SPECIAL_NODE_RADIUS],
            [x + SPECIAL_NODE_RADIUS, y + SPECIAL_NODE_RADIUS],
          ],
          position
        );
      })
    )
  );
}

export const Ctx = () => ({
  addNode,
  addEdge,
  getNode,
  $graph,
  $algorithmPresentation,
  $click,
  $mode,
  $originNode,
  $algorithm,
  containerEl,
  sandboxBtnEl,
  saveBtnEl,
  loadBtnEl,
  runBtnEl,
  clearBtnEl,
  comparissonsBtnEl,
  canvasEl,
  algorithmsModalEl,
  algorithmsModalContainerEl,
  comparissonModalEl,
  resultModalEl,
  resultModalContainerEl,
  comparissonModalContainerEl,
  canvasCtx,
});
