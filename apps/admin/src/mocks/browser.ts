export const worker = {
  async start(opts?: any) {
    // Dynamically import msw and handlers to avoid Vite pre-bundling issues.
    let setupWorkerFn: any = undefined;

    // Prefer the browser export
    try {
      const mswModule = await import("msw/browser");
      console.debug("msw/browser keys:", Object.keys(mswModule));
      setupWorkerFn =
        setupWorkerFn ?? (mswModule as any).setupWorker ?? (mswModule as any).default?.setupWorker;
    } catch (err) {
      console.debug("msw/browser import failed:", err instanceof Error ? err.message : String(err));
    }

    // Fallback: try the package root
    if (!setupWorkerFn) {
      try {
        const mswModule = await import("msw");
        console.debug("msw keys:", Object.keys(mswModule));
        setupWorkerFn =
          setupWorkerFn ??
          (mswModule as any).setupWorker ??
          (mswModule as any).default?.setupWorker;
      } catch (err) {
        console.debug("msw import failed:", err instanceof Error ? err.message : String(err));
      }
    }

    if (!setupWorkerFn) {
      console.error("MSW: setupWorker not found on any msw module import");
      return;
    }

    const { createHandlers } = await import("./handlers");
    const handlers = await createHandlers();
    const w = setupWorkerFn(...(Array.isArray(handlers) ? handlers : []));
    return w.start({ onUnhandledRequest: "bypass", ...(opts ?? {}) }).then(() => {
      console.info("MSW started (dev)");
    });
  },
};
