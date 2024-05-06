import * as draw from "./draw.mjs";
import * as handlers from "./handlers.mjs";
import { Ctx } from "./context.mjs";
import { RUN_EVENT_TYPE, MODE } from "./constants.mjs";

Ctx().$mode.subscribe(handlers.onModeChange);

rxjs
  .merge(Ctx().$algorithm, Ctx().$mode)
  .pipe(
    rxjs.operators.combineLatest([Ctx().$graph, Ctx().$originNode]),
    rxjs.operators.map(([_, graph, originNode]) => ({ graph, originNode }))
  )
  .subscribe((data) => draw.paint(data.graph, data.originNode));

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
    rxjs.operators.mergeMap(([origin, mode]) =>
      Ctx().$graph.pipe(
        rxjs.operators.take(1),
        rxjs.operators.map((graph) => ({
          origin,
          mode,
          graph,
        }))
      )
    ),
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
    )
  )
  .subscribe(handlers.handleOpenAlgorithmsModal);

rxjs
  .combineLatest([Ctx().$originNode, Ctx().$mode, Ctx().$algorithm])
  .pipe(
    rxjs.operators.mergeMap(([origin, mode, algorithm]) =>
      Ctx().$graph.pipe(
        rxjs.operators.take(1),
        rxjs.operators.map((graph) => ({
          origin,
          mode,
          graph,
          algorithm,
        }))
      )
    ),
    rxjs.operators.filter(
      (payload) =>
        payload.mode === MODE.RUN && !!payload.origin && !!payload.algorithm
    )
  )
  .subscribe(handlers.handleRunMode);

rxjs
  .combineLatest([Ctx().$originNode, Ctx().$mode, Ctx().$algorithm])
  .pipe(
    rxjs.operators.mergeMap(([origin, mode, algorithm]) =>
      Ctx().$graph.pipe(
        rxjs.operators.take(1),
        rxjs.operators.map((graph) => ({
          origin,
          mode,
          graph,
          algorithm,
        }))
      )
    ),
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
    ),
    rxjs.operators.mergeMap((event) =>
      Ctx().$graph.pipe(
        rxjs.operators.take(1),
        rxjs.operators.map((graph) => ({ graph, event }))
      )
    )
  )
  .subscribe(draw.paintAlgorithmPresentation);

Ctx()
  .$algorithmPresentation.pipe(
    rxjs.operators.concatMap((event) =>
      rxjs.of(event).pipe(rxjs.operators.delay(200))
    ),
    rxjs.operators.withLatestFrom(Ctx().$mode),
    rxjs.operators.withLatestFrom(Ctx().$algorithm),
    rxjs.operators.filter(
      ([[event, mode]]) =>
        mode === MODE.RUN && event.type === RUN_EVENT_TYPE.END
    ),
    rxjs.operators.mergeMap(([[event], algorithm]) =>
      Ctx().$graph.pipe(
        rxjs.operators.take(1),
        rxjs.operators.map((graph) => ({
          path: event.payload.path,
          iterations: event.payload.iterations,
          graph,
          algorithm,
        }))
      )
    )
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
    rxjs.operators.mergeMap(([, origin]) =>
      Ctx().$graph.pipe(
        rxjs.operators.take(1),
        rxjs.operators.map((graph) => ({
          origin,
          graph,
        }))
      )
    )
  )
  .subscribe(handlers.handleComparissonMode);

rxjs
  .fromEvent(Ctx().containerEl, "click")
  .pipe(
    rxjs.operators.tap((e) => e.stopPropagation()),
    rxjs.operators.withLatestFrom(Ctx().$mode),
    rxjs.operators.map(([event, mode]) => ({ mode, event }))
  )
  .subscribe(handlers.handleClick);

rxjs
  .fromEvent(Ctx().saveBtnEl, "click")
  .pipe(
    rxjs.operators.tap((e) => e.stopPropagation()),
    rxjs.operators.mergeMap(() => Ctx().$graph.pipe(rxjs.operators.take(1)))
  )
  .subscribe(handlers.handleSave);

rxjs
  .fromEvent(Ctx().loadBtnEl, "click")
  .pipe(rxjs.operators.tap((e) => e.stopPropagation()))
  .subscribe(handlers.handleLoad);

rxjs
  .fromEvent(Ctx().sandboxBtnEl, "click")
  .pipe(rxjs.operators.tap((e) => e.stopPropagation()))
  .subscribe(() => handlers.handleChangeMode(MODE.SANDBOX));

rxjs
  .fromEvent(Ctx().runBtnEl, "click")
  .pipe(rxjs.operators.tap((e) => e.stopPropagation()))
  .subscribe(() => handlers.handleChangeMode(MODE.RUN));

rxjs
  .fromEvent(Ctx().comparissonsBtnEl, "click")
  .pipe(rxjs.operators.tap((e) => e.stopPropagation()))
  .subscribe(() => handlers.handleChangeMode(MODE.COMPARISSON));

rxjs
  .fromEvent(Ctx().clearBtnEl, "click")
  .pipe(
    rxjs.operators.tap((e) => e.stopPropagation()),
    rxjs.operators.mergeMap(() => Ctx().$graph.pipe(rxjs.operators.take(1)))
  )
  .subscribe(handlers.handleClear);

rxjs
  .fromEvent(Ctx().loadPresetBtnEl, "click")
  .pipe(rxjs.operators.tap((e) => e.stopPropagation()))
  .subscribe(handlers.handleLoadPreset);

rxjs
  .fromEvent(window, "click")
  .pipe(
    rxjs.operators.filter((e) => !Ctx().tutorialModalEl.contains(e.target)),
    rxjs.operators.take(1)
  )
  .subscribe(handlers.handleCloseTutorialModal);

rxjs
  .fromEvent(Ctx().tutorialModeControlsEl, "click")
  .pipe(
    rxjs.operators.map((e) =>
      Array.from(Ctx().tutorialModeControlsEl.querySelectorAll("button")).find(
        (buttonEl) => buttonEl.contains(e.target)
      )
    ),
    rxjs.operators.filter((exists) => !!exists),
    rxjs.operators.takeWhile(() =>
      Ctx().tutorialModalContainerEl.classList.contains("open")
    ),
    rxjs.operators.map((buttonEl) => buttonEl.getAttribute("data-id"))
  )
  .subscribe(handlers.handleTutorialModeChange);

handlers.handleStartup();
