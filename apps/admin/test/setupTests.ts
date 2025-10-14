import { beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import handlers from "../src/mocks/handlers";

// Create an MSW server with the same handlers used by the browser mocks.
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

export { server };
