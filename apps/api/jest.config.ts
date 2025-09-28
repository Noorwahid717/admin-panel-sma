import type { Config } from "jest";

const config: Config = {
  rootDir: ".",
  moduleFileExtensions: ["js", "json", "ts"],
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  collectCoverageFrom: ["src/**/*.(t|j)s"],
  coverageDirectory: "coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@shared/(.*)": "<rootDir>/../shared/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
};

export default config;
