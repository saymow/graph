import { Ctx } from "./context.mjs";
import {
  MODE,
  RUN_EVENT_TYPE,
  NODE_STATUS,
  NODE_TYPE,
  LOCAL_STORAGE_KEY,
} from "./constants.mjs";
import * as algorithms from "./algorithms-metadata.mjs";
import * as elements from "./elements.mjs";
import * as draw from "./draw.mjs";
import { computePathDistance } from "./utils.mjs";
import InitialGraph from "./initial-graph.mjs";

function setUpCanvas() {
  Ctx().canvasEl.width = Ctx().canvasEl.clientWidth;
  Ctx().canvasEl.height = Ctx().canvasEl.clientHeight;
}

export function handleCloseTutorialModal() {
  Ctx().tutorialModalContainerEl.classList.remove("open");
}

export function handleTutorialModeChange(mode) {
  const activeModeSectionEl = Ctx().tutorialModalEl.querySelector(
    `.mode-tutorial[data-id="${mode}"]`
  );
  const modeSectionsEls =
    Ctx().tutorialModalEl.querySelectorAll(".mode-tutorial");
  const modeButtonEls = Ctx().tutorialModalEl.querySelectorAll("button");

  for (const modeSectionEl of modeSectionsEls) {
    if (modeSectionEl === activeModeSectionEl) {
      modeSectionEl.classList.remove("hidden");
    } else {
      modeSectionEl.classList.add("hidden");
    }
  }

  for (const modeButtonEl of modeButtonEls) {
    if (modeButtonEl.getAttribute("data-id") === mode) {
      modeButtonEl.setAttribute("highlight", "highlight");
    } else {
      modeButtonEl.removeAttribute("highlight");
    }
  }
}

export function handleStartup() {
  setUpCanvas();
  handleLoadAlgorithmsOptions();

  const json = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (json) {
    Ctx().$graph.next(JSON.parse(json));
  } else {
    handleLoadPreset();
  }
}

export function handleLoadPreset() {
  Ctx().$graph.next(JSON.parse(JSON.stringify(InitialGraph)));
  Ctx().$algorithm.next(null);
  Ctx().$originNode.next(null);
}

export function handleClick(data) {
  const { mode, event } = data;
  const position = [event.x, event.y];

  Ctx()
    .getNode(position)
    .pipe(rxjs.withLatestFrom(Ctx().$graph), rxjs.operators.take(1))
    .subscribe(([targetIdx, graph]) => {
      const payload = {
        graph,
        mode,
        position,
        targetIdx,
        target: graph.nodes[targetIdx],
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
      };

      Ctx().$click.next(payload);
    });
}

export function handleLoad() {
  try {
    const json = window.prompt("Enter graph: ");

    if (json === null) return;

    const config = JSON.parse(json);
    Ctx().$graph.next(config);
  } catch {
    window.alert("Invalid JSON!");
  }
}

export function handleSave(graph) {
  const json = JSON.stringify(graph);
  localStorage.setItem(LOCAL_STORAGE_KEY, json);
  navigator.clipboard.writeText(json);

  alert("Graph is copied");
}

export function handleChangeMode(mode) {
  Ctx().$algorithm.next(null);
  Ctx().$originNode.next(null);
  Ctx().$mode.next(mode);
}

export function handleClear() {
  Ctx().$graph.next({ nodes: [], matrix: [] });
  Ctx().$algorithm.next(null);
  Ctx().$originNode.next(null);
  localStorage.removeItem(LOCAL_STORAGE_KEY);
}

export function onModeChange(mode) {
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
  const {
    algorithm,
    origin,
    graph: { nodes, matrix },
  } = payload;
  const targetIdx = nodes.indexOf(origin);

  draw.drawHighlightedNode(Ctx().canvasCtx, nodes, origin);

  const { path, iterations } = algorithm.handle(
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
    payload: { path, iterations },
  });
}

export function handleSandboxModeClick(payload) {
  const { graph, position, targetIdx } = payload;

  Ctx()
    .$originNode.pipe(rxjs.operators.take(1))
    .subscribe((originNode) => {
      if (payload.ctrlKey) {
        if (targetIdx === -1) {
          Ctx().$originNode.next(null);
          return;
        }

        if (!originNode) {
          Ctx().$originNode.next(graph.nodes[targetIdx]);
        } else {
          const originNodeIdx = graph.nodes.indexOf(originNode);
          const targetNodeIdx = targetIdx;

          Ctx().$originNode.next(null);
          Ctx().addEdge([originNodeIdx, targetNodeIdx]);
        }
      } else {
        if (targetIdx !== -1) return;

        const type = payload.altKey ? NODE_TYPE.FINAL : NODE_TYPE.NORMAL;

        Ctx().$originNode.next(null);
        Ctx().addNode({ type, position });
      }
    });
}

export function handleComparissonModeClick(payload) {
  if (!payload.target) return;
  Ctx().$originNode.next(payload.target);
}

export function handleComparissonMode(payload) {
  const {
    origin: target,
    graph: { nodes, matrix },
  } = payload;
  const targetIdx = nodes.indexOf(target);

  draw.drawHighlightedNode(Ctx().canvasCtx, nodes, target);

  const containerEl = document.querySelector('[data-id="algorithm-metrics"]');

  containerEl.innerHTML = "";
  algorithms.getAll().forEach((algorithm) => {
    const { path, iterations } = algorithm.handle(
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
        iterations,
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
  if (path.length === 0) {
    return { finalNode: -1, nodesCount: -1, distance: -1 };
  }

  const finalNode = nodes[path[0]];

  if (finalNode.type === NODE_TYPE.NORMAL) {
    return { finalNode: -1, nodesCount: -1, distance: -1 };
  }

  const nodesPath = path.map((nodeIdx) => nodes[nodeIdx]);
  const nodesCount = path.length - 1;
  const distance = computePathDistance(nodesPath).toFixed(2);
  const finalNodeText = draw.makeFinalNodeText(nodes, finalNode);

  return { nodesCount, distance, finalNode: finalNodeText };
}

export function handleOpenResultModal(payload) {
  const { path, iterations, graph, algorithm } = payload;
  const { finalNode, nodesCount, distance } = getPathInformation(
    graph.nodes,
    path
  );

  Ctx().resultModalContainerEl.querySelector("h1").textContent = algorithm.name;
  Ctx().resultModalContainerEl.querySelector('[data-id="nodes"]').textContent =
    nodesCount;
  Ctx().resultModalContainerEl.querySelector(
    '[data-id="distance"]'
  ).textContent = distance;
  Ctx().resultModalContainerEl.querySelector(
    '[data-id="final-node"]'
  ).textContent = finalNode;
  Ctx().resultModalContainerEl.querySelector(
    '[data-id="iterations"]'
  ).textContent = iterations;
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
