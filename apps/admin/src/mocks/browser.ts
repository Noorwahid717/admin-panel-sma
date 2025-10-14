export const worker = {
  async start(opts?: any) {
    // Dynamically import msw and handlers to avoid Vite pre-bundling issues.
    // Try several known entry points so we can extract both setupWorker and rest
    let setupWorkerFn: any = undefined;
    let restObj: any = undefined;

    // Try msw/browser first (preferred)
    try {
      // @ts-ignore
      const mswModule = await import("msw/browser");
      // eslint-disable-next-line no-console
      console.debug("msw/browser keys:", Object.keys(mswModule));
      setupWorkerFn =
        setupWorkerFn ?? (mswModule as any).setupWorker ?? (mswModule as any).default?.setupWorker;
      restObj = restObj ?? (mswModule as any).rest ?? (mswModule as any).default?.rest;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.debug("msw/browser import failed:", err instanceof Error ? err.message : String(err));
    }

    // Fallback: try plain msw
    if (!setupWorkerFn || !restObj) {
      try {
        // @ts-ignore
        const mswModule = await import("msw");
        // eslint-disable-next-line no-console
        console.debug("msw keys:", Object.keys(mswModule));
        setupWorkerFn =
          setupWorkerFn ??
          (mswModule as any).setupWorker ??
          (mswModule as any).default?.setupWorker;
        restObj = restObj ?? (mswModule as any).rest ?? (mswModule as any).default?.rest;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.debug("msw import failed:", err instanceof Error ? err.message : String(err));
      }
    }

    // Final fallback: try deep path to the built browser module
    if (!setupWorkerFn || !restObj) {
      try {
        // @ts-ignore
        const mswModule = await import("msw/lib/browser/index.mjs");
        // eslint-disable-next-line no-console
        console.debug("msw/lib/browser/index.mjs keys:", Object.keys(mswModule));
        setupWorkerFn =
          setupWorkerFn ??
          (mswModule as any).setupWorker ??
          (mswModule as any).default?.setupWorker;
        restObj = restObj ?? (mswModule as any).rest ?? (mswModule as any).default?.rest;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.debug(
          "msw/lib/browser/index.mjs import failed:",
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    if (!setupWorkerFn) {
      // eslint-disable-next-line no-console
      console.error("MSW: setupWorker not found on any msw module import");
      return;
    }

    if (!restObj) {
      // eslint-disable-next-line no-console
      console.warn("MSW: could not find 'rest' export on msw modules; handlers may be empty");
    }

    // Import handlers factory and pass the discovered rest helper (may be undefined)
    // @ts-ignore
    const { createHandlers } = await import("./handlers");
    const handlers = await createHandlers(restObj);
    const w = setupWorkerFn(...(Array.isArray(handlers) ? handlers : []));
    return w.start(opts as any).then(() => {
      // Confirm worker started in the browser console for easier debugging
      // eslint-disable-next-line no-console
      console.info("MSW started (dev)");
    });
  },
};
