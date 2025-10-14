// Minimal MSW shims to make local typechecking happy. Replace with proper types if needed.
declare module "msw" {
  export const rest: any;
  export function setupWorker(...handlers: any[]): any;
  export function setupServer(...handlers: any[]): any;
  export type RestRequest = any;
  export type RestContext = any;
  export type ResponseComposition = any;
}

declare module "msw/browser" {
  export * from "msw";
}

declare module "msw/node" {
  export * from "msw";
}
