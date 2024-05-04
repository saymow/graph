import * as creator from "./creator.mjs";
import * as draw from "./draw.mjs";
import * as handlers from "./handlers.mjs";
import { Ctx } from "./context.mjs";
import {
  LOCAL_STORAGE_KEY,
  NODE_STATUS,
  RUN_EVENT_TYPE,
  MODE,
} from "./constants.mjs";

let nodes = [];
let matrix = [];

function setUpCanvas() {
  Ctx().canvasEl.width = Ctx().canvasEl.clientWidth;
  Ctx().canvasEl.height = Ctx().canvasEl.clientHeight;
}

function load(config) {
  nodes = config.nodes;
  matrix = config.matrix;
  paint();
}

function paint(originNode) {
  const originNodeIdx = nodes.indexOf(originNode);
  Ctx().canvasCtx.clearRect(0, 0, Ctx().canvasEl.width, Ctx().canvasEl.height);

  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      if (matrix[i][j] === 1) {
        draw.drawEdge(Ctx().canvasCtx, nodes[i], nodes[j]);
      }
    }
  }

  for (let idx = 0; idx < nodes.length; idx++) {
    if (idx === originNodeIdx) {
      draw.drawHighlightedNode(Ctx().canvasCtx, nodes, nodes[idx]);
    } else {
      draw.drawNode(Ctx().canvasCtx, nodes, nodes[idx]);
    }
  }
}

function paintAlgorithmPresentation(event) {
  const { type, payload } = event;

  switch (type) {
    case RUN_EVENT_TYPE.NODE:
      switch (payload.status) {
        case NODE_STATUS.DISCOVERED:
          draw.drawDiscoveredNode(Ctx().canvasCtx, nodes, payload.node);
          break;
        case NODE_STATUS.VISITED:
          draw.drawVisitedNode(Ctx().canvasCtx, nodes, payload.node);
          break;
        case NODE_STATUS.FOUND:
          draw.drawFoundNode(Ctx().canvasCtx, nodes, payload.node);
          break;
        case NODE_STATUS.PATH:
          draw.drawPathNode(Ctx().canvasCtx, nodes, payload.node);
          break;
      }
      break;
    case RUN_EVENT_TYPE.EDGE:
      draw.drawHighlightedEdge(
        Ctx().canvasCtx,
        payload.originNode,
        payload.targetNode
      );
      break;
  }
}

Ctx().$addNode.subscribe((node) => creator.addNode(matrix, nodes, node));

Ctx().$addEdge.subscribe((edge) => creator.addEdge(matrix, edge));

Ctx().$mode.subscribe(handlers.handleModeChanges);

rxjs
  .merge(
    Ctx().$originNode,
    Ctx().$algorithm,
    Ctx().$mode,
    Ctx().$addNode,
    Ctx().$addEdge
  )
  .subscribe(paint);

Ctx()
  .$click.pipe(
    rxjs.operators.filter((payload) => payload.mode === MODE.SANDBOX)
  )
  .subscribe(handlers.handleSandboxModeClick);

Ctx()
  .$click.pipe(rxjs.operators.filter((payload) => payload.mode === MODE.RUN))
  .subscribe(handlers.handleRunModeClick);

Ctx()
  .$click.pipe(
    rxjs.operators.filter((payload) => payload.mode === MODE.COMPARISSON)
  )
  .subscribe(handlers.handleComparissonModeClick);

rxjs
  .combineLatest([Ctx().$originNode, Ctx().$mode])
  .pipe(
    rxjs.operators.map(([origin, mode]) => ({
      origin,
      mode,
      nodes,
      matrix,
    })),
    rxjs.operators.filter(
      (payload) => payload.mode === MODE.COMPARISSON && !!payload.origin
    )
  )
  .subscribe(handlers.handleComparissonMode);

rxjs
  .combineLatest([Ctx().$originNode, Ctx().$mode, Ctx().$algorithm])
  .pipe(
    rxjs.operators.map(([origin, mode, algorithm]) => ({
      origin,
      mode,
      algorithm,
    })),
    rxjs.operators.filter(
      (payload) =>
        payload.mode === MODE.RUN && !!payload.origin && !payload.algorithm
    ),
    rxjs.operators.tap((payload) => console.log({ payload }))
  )
  .subscribe(handlers.handleOpenAlgorithmsModal);

rxjs
  .combineLatest([Ctx().$originNode, Ctx().$mode, Ctx().$algorithm])
  .pipe(
    rxjs.operators.map(([origin, mode, algorithm]) => ({
      matrix,
      nodes,
      origin,
      mode,
      algorithm,
    })),
    rxjs.operators.filter(
      (payload) =>
        payload.mode === MODE.RUN && !!payload.origin && !!payload.algorithm
    )
  )
  .subscribe(handlers.handleRunMode);

rxjs
  .combineLatest([Ctx().$originNode, Ctx().$mode, Ctx().$algorithm])
  .pipe(
    rxjs.operators.map(([origin, mode, algorithm]) => ({
      matrix,
      nodes,
      origin,
      mode,
      algorithm,
    })),
    rxjs.operators.filter(
      (payload) =>
        payload.mode === MODE.COMPARISSON &&
        !!payload.origin &&
        !!payload.algorithm
    )
  )
  .subscribe(handlers.handleRunAlgorithmComparissonMode);

Ctx()
  .$algorithmPresentation.pipe(
    rxjs.operators.concatMap((event) =>
      rxjs.of(event).pipe(rxjs.operators.delay(200))
    )
  )
  .subscribe(paintAlgorithmPresentation);

Ctx()
  .$algorithmPresentation.pipe(
    rxjs.operators.concatMap((event) =>
      rxjs.of(event).pipe(rxjs.operators.delay(200))
    ),
    rxjs.operators.withLatestFrom(Ctx().$mode),
    rxjs.operators.withLatestFrom(Ctx().$algorithm),
    rxjs.operators.filter(
      ([[event, mode]]) => mode === MODE.RUN && event.type === RUN_EVENT_TYPE.END
    ),
    rxjs.operators.map(([[event], algorithm]) => ({
      path: event.payload.path,
      nodes,
      matrix,
      algorithm
    }))
  )
  .subscribe(handlers.handleOpenResultModal);

Ctx()
  .$algorithmPresentation.pipe(
    rxjs.operators.concatMap((event) =>
      rxjs.of(event).pipe(rxjs.operators.delay(200))
    ),
    rxjs.operators.withLatestFrom(Ctx().$mode),
    rxjs.operators.withLatestFrom(Ctx().$originNode),
    rxjs.operators.filter(
      ([[event, mode], origin]) =>
        mode === MODE.COMPARISSON && origin && event.type === RUN_EVENT_TYPE.END
    ),
    rxjs.operators.map(([, origin]) => ({ origin, nodes, matrix }))
  )
  .subscribe(handlers.handleComparissonMode);

rxjs
  .fromEvent(Ctx().containerEl, "click")
  .pipe(
    rxjs.operators.tap((e) => e.stopPropagation()),
    rxjs.operators.withLatestFrom(Ctx().$mode)
  )
  .subscribe((data) => {
    const [e, mode] = data;
    const position = [e.x, e.y];
    const targetIdx = creator.getNode(nodes, position);
    const payload = {
      nodes,
      matrix,
      mode,
      position,
      targetIdx,
      target: nodes[targetIdx],
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
    };

    Ctx().$click.next(payload);
  });

Ctx().saveBtnEl.addEventListener("click", (e) => {
  e.stopPropagation();

  const data = JSON.stringify({
    nodes,
    matrix,
  });

  localStorage.setItem(LOCAL_STORAGE_KEY, data);
  navigator.clipboard.writeText(data);

  alert("Graph is copied");
});

Ctx().loadBtnEl.addEventListener("click", (e) => {
  e.stopPropagation();

  const config = JSON.parse(window.prompt("Enter graph: "));
  load(config);
});

Ctx().sandboxBtnEl.addEventListener("click", (e) => {
  e.stopPropagation();
  Ctx().$algorithm.next(null);
  Ctx().$originNode.next(null);
  Ctx().$mode.next(MODE.SANDBOX);
});

Ctx().runBtnEl.addEventListener("click", (e) => {
  e.stopPropagation();
  Ctx().$algorithm.next(null);
  Ctx().$originNode.next(null);
  Ctx().$mode.next(MODE.RUN);
});

Ctx().comparissonsBtnEl.addEventListener("click", (e) => {
  e.stopPropagation();
  Ctx().$algorithm.next(null);
  Ctx().$originNode.next(null);
  Ctx().$mode.next(MODE.COMPARISSON);
});

Ctx().clearBtnEl.addEventListener("click", (e) => {
  e.stopPropagation();

  Ctx().$mode.next(MODE.SANDBOX);
  matrix = [];
  nodes = [];
});

(() => {
  setUpCanvas();
  handlers.handleLoadAlgorithmsOptions();

  const config = localStorage.getItem(LOCAL_STORAGE_KEY);

  if (config) {
    load(JSON.parse(config));
  }
})();
