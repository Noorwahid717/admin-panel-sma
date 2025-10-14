import { setupWorker } from "msw";
import handlers from "./handlers";

// Create a Service Worker with the provided handlers.
export const worker = setupWorker(...handlers);

// Optionally export a start helper with sensible defaults
export const startWorker = (options?: Parameters<typeof worker.start>[0]) => worker.start(options);

export default worker;
