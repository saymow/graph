import { Ctx } from "./context.mjs";
import { MODE, RUN_EVENT_TYPE, NODE_STATUS, NODE_TYPE } from "./constants.mjs";
import * as algorithms from "./algorithms-metadata.mjs";
import * as elements from "./elements.mjs";
import * as draw from "./draw.mjs";
import * as creator from "./creator.mjs";
import { computePathDistance } from "./utils.mjs";

export function handleModeChanges(mode) {
  let activeModeBtnEl;

  if (mode === MODE.SANDBOX) activeModeBtnEl = Ctx().sandboxBtnEl;
  else if (mode === MODE.RUN) activeModeBtnEl = Ctx().runBtnEl;
  else activeModeBtnEl = Ctx().comparissonsBtnEl;

  const modeBtnEls = [
    Ctx().sandboxBtnEl,
    Ctx().runBtnEl,
    Ctx().comparissonsBtnEl,
  ];

  modeBtnEls.forEach((modeBtnEl) => {
    if (modeBtnEl === activeModeBtnEl) {
      modeBtnEl.setAttribute("highlight", "highlight");
    } else {
      modeBtnEl.removeAttribute("highlight");
    }
  });
}

export function handleRunAlgorithmPresentation(payload) {
  const { algorithm, origin, nodes, matrix } = payload;
  const targetIdx = nodes.indexOf(origin);

  draw.drawHighlightedNode(Ctx().canvasCtx, nodes, origin);

  const path = algorithm.handle(
    nodes,
    matrix,
    targetIdx,
    (idx) => {
      if (targetIdx === idx) return;
      Ctx().$algorithmPresentation.next({
        type: RUN_EVENT_TYPE.NODE,
        payload: { status: NODE_STATUS.DISCOVERED, node: nodes[idx] },
      });
    },
    (idx) => {
      if (targetIdx === idx) return;
      Ctx().$algorithmPresentation.next({
        type: RUN_EVENT_TYPE.NODE,
        payload: { status: NODE_STATUS.VISITED, node: nodes[idx] },
      });
    },
    (idx) => {
      Ctx().$algorithmPresentation.next({
        type: RUN_EVENT_TYPE.NODE,
        payload: { status: NODE_STATUS.FOUND, node: nodes[idx] },
      });
    }
  );

  for (let idx = 0; idx < path.length; idx++) {
    if (idx !== 0 && idx !== path.length - 1) {
      Ctx().$algorithmPresentation.next({
        type: RUN_EVENT_TYPE.NODE,
        payload: { status: NODE_STATUS.PATH, node: nodes[path[idx]] },
      });
    }
    if (idx !== path.length - 1) {
      Ctx().$algorithmPresentation.next({
        type: RUN_EVENT_TYPE.EDGE,
        payload: {
          originNode: nodes[path[idx]],
          targetNode: nodes[path[idx + 1]],
        },
      });
    }
  }

  Ctx().$algorithmPresentation.next({
    type: RUN_EVENT_TYPE.END,
    payload: { path },
  });
}

export function handleSandboxModeClick(payload) {
  const { nodes, position, targetIdx } = payload;

  Ctx()
    .$originNode.pipe(rxjs.operators.take(1))
    .subscribe((originNode) => {
      if (payload.ctrlKey) {
        if (targetIdx === -1) {
          Ctx().$originNode.next(null);
          return;
        }

        if (!originNode) {
          Ctx().$originNode.next(nodes[targetIdx]);
        } else {
          const originNodeIdx = nodes.indexOf(originNode);
          const targetNodeIdx = targetIdx;

          Ctx().$addEdge.next([originNodeIdx, targetNodeIdx]);
          Ctx().$originNode.next(null);
        }
      } else {
        if (creator.getNode(nodes, position) !== -1) return;

        const type = payload.altKey ? NODE_TYPE.FINAL : NODE_TYPE.NORMAL;

        Ctx().$originNode.next(null);
        Ctx().$addNode.next({ type, pos: position });
      }
    });
}

export function handleComparissonModeClick(payload) {
  if (!payload.target) return;
  Ctx().$originNode.next(payload.target);
}

export function handleComparissonMode(payload) {
  const { origin: target, nodes, matrix } = payload;
  const targetIdx = nodes.indexOf(target);

  draw.drawHighlightedNode(Ctx().canvasCtx, nodes, target);

  const containerEl = document.querySelector('[data-id="algorithm-metrics"]');

  containerEl.innerHTML = "";
  algorithms.getAll().forEach((algorithm) => {
    const path = algorithm.handle(
      nodes,
      matrix,
      targetIdx,
      () => {},
      () => {},
      () => {}
    );

    containerEl.appendChild(
      elements.makeAlgorithmInformationEl(
        algorithm,
        getPathInformation(nodes, path),
        handleComparissonAlgorithmClick
      )
    );
  });

  Ctx().comparissonModalContainerEl.classList.add("open");
  rxjs
    .fromEvent(window, "click")
    .pipe(
      rxjs.operators.filter(
        (e) => !Ctx().comparissonModalEl.contains(e.target)
      ),
      rxjs.operators.take(1)
    )
    .subscribe(handleFinishComparisson);
}

export function handleRunModeClick(payload) {
  if (!payload.target) return;
  Ctx().$originNode.next(payload.target);
}

export function handleRunMode(payload) {
  handleRunAlgorithmPresentation(payload);
}

export function handleRunAlgorithmComparissonMode(payload) {
  handleCloseComparissonModal();
  handleRunAlgorithmPresentation(payload);
}

export function handleFinishComparisson() {
  Ctx().$algorithm.next(null);
  Ctx().$originNode.next(null);
  handleCloseComparissonModal();
}

export function handleCloseComparissonModal() {
  Ctx().comparissonModalContainerEl.classList.remove("open");

  Ctx()
    .comparissonModalContainerEl.querySelectorAll("button[data-id]")
    .forEach((buttonEl) => {
      buttonEl.removeEventListener("click", handleComparissonAlgorithmClick);
    });
}

export function handleComparissonAlgorithmClick(e) {
  e.stopPropagation();
  const algorithmName = e.target.getAttribute("data-id");

  Ctx().$algorithm.next(algorithms.makeAlgorithm(algorithmName));
}

export function closeAlgorithmsModal() {
  Ctx().algorithmsModalContainerEl.classList.remove("open");
  Ctx()
    .algorithmsModalContainerEl.querySelectorAll("button")
    .forEach((btn) => {
      btn.removeEventListener("click", handleAlgorithmButtonClick);
    });
}

export function handleAlgorithmButtonClick(e) {
  const algorithmName = e.target.getAttribute("data-id");

  closeAlgorithmsModal();
  Ctx().$algorithm.next(algorithms.makeAlgorithm(algorithmName));
}

export function handleCloseResultsModal() {
  Ctx().$originNode.next(null);
  Ctx().$algorithm.next(null);

  Ctx().resultModalContainerEl.classList.remove("open");
}

export function getPathInformation(nodes, path) {
  const finalNode = nodes[path[0]];

  if (finalNode.type === NODE_TYPE.NORMAL) {
    return null;
  }

  const nodesPath = path.map((nodeIdx) => nodes[nodeIdx]);
  const nodesCount = path.length - 1;
  const distance = computePathDistance(nodesPath).toFixed(2);
  const finalNodeText = draw.makeFinalNodeText(nodes, finalNode);

  return { nodesCount, distance, finalNode: finalNodeText };
}

export function handleOpenResultModal(payload) {
  const { path, nodes, algorithm } = payload;
  const { finalNode, nodesCount, distance } = getPathInformation(nodes, path);

  Ctx().resultModalContainerEl.querySelector("h1").textContent = algorithm.name;
  Ctx().resultModalContainerEl.querySelector('[data-id="nodes"]').textContent =
    nodesCount;
  Ctx().resultModalContainerEl.querySelector(
    '[data-id="distance"]'
  ).textContent = distance;
  Ctx().resultModalContainerEl.querySelector(
    '[data-id="final-node"]'
  ).textContent = finalNode;
  Ctx().resultModalContainerEl.classList.add("open");

  rxjs
    .fromEvent(
      Ctx().resultModalContainerEl.querySelector('button[data-id="continue"]'),
      "click"
    )
    .pipe(rxjs.operators.take(1))
    .subscribe(handleCloseResultsModal);
}

export function handleOpenAlgorithmsModal() {
  Ctx().algorithmsModalContainerEl.classList.add("open");
  Ctx()
    .algorithmsModalContainerEl.querySelectorAll("button")
    .forEach((btn) => {
      btn.addEventListener("click", handleAlgorithmButtonClick);
    });

  rxjs
    .fromEvent(window, "click")
    .pipe(
      rxjs.operators.filter((e) => !Ctx().algorithmsModalEl.contains(e.target)),
      rxjs.operators.take(1)
    )
    .subscribe(() => {
      Ctx().$originNode.next(null);
      closeAlgorithmsModal();
    });
}

export function handleLoadAlgorithmsOptions() {
  const containerEl = document.querySelector('[data-id="algorithm-options"]');

  algorithms
    .getAll()
    .forEach((algorithm) =>
      containerEl.appendChild(elements.makeOptionEl(algorithm))
    );
}
