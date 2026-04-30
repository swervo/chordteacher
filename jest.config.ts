import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        rootDir: ".",
        moduleResolution: "node",
        ignoreDeprecations: "6.0",
      },
    }],
  },
};

export default config;
