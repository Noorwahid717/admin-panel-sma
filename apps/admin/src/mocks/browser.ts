export const worker = {
  async start(opts?: any) {
    // Dynamically import msw and handlers to avoid Vite pre-bundling issues
    // Dynamically import msw and handlers; be defensive about export shapes
    // Import the browser-specific entry so Vite/runtime gets setupWorker & rest
    // @ts-ignore
    const mswModule = await import("msw/browser");
    // eslint-disable-next-line no-console
    console.debug("msw module keys:", Object.keys(mswModule));
    const setupWorkerFn = (mswModule as any).setupWorker ?? (mswModule as any).default?.setupWorker;
    const restObj = (mswModule as any).rest ?? (mswModule as any).default?.rest;
    if (!setupWorkerFn) {
      // eslint-disable-next-line no-console
      console.error("MSW: setupWorker not found on msw module", mswModule);
      return;
    }
    if (!restObj) {
      // eslint-disable-next-line no-console
      console.warn("MSW: could not find 'rest' export on msw module", Object.keys(mswModule));
    }
    // @ts-ignore
    const { createHandlers } = await import("./handlers");
    const handlers = await createHandlers(restObj);
    const w = setupWorkerFn(...handlers);
    return w.start(opts as any).then(() => {
      // Confirm worker started in the browser console for easier debugging
      // eslint-disable-next-line no-console
      console.info("MSW started (dev)");
    });
  },
};
