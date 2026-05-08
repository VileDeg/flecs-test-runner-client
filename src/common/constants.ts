import type { UnitTest, UnitTestProps } from "./types";
import { type WorkspaceState } from "./workspaceTypes";

export const FLECS_PORT = 27750;
export const BASE_URL = `http://localhost:${FLECS_PORT}`;
export const TEST_RUNNER_NAME = "TestRunner";
export const TEST_RUNNER_NAME_2 = "TestRunnerImpl";
export const UNIT_TEST_NAME = "UnitTest";
export const UNIT_TEST_COMPONENT_NAME = `${TEST_RUNNER_NAME}.${UNIT_TEST_NAME}`;
export const UNIT_TEST_READY_TAG_NAME = `${TEST_RUNNER_NAME}.Ready`;
export const UNIT_TEST_INCOMPLETE_TAG_NAME = `${TEST_RUNNER_NAME}.Incomplete`;
export const UNIT_TEST_EXECUTED_TAG_NAME = `${TEST_RUNNER_NAME}.Executed`;
export const UNIT_TEST_PASSED_TAG_NAME = `${TEST_RUNNER_NAME}.Passed`;

const urlParams = new URLSearchParams(window.location.search);
export const TEST_EXECUTION_TIMEOUT_MS = parseInt(
  urlParams.get("timeout") ?? "10000",
);
export const TEST_EXECUTION_MAX_BATCH_SIZE = parseInt(
  urlParams.get("batch_size") ?? "10",
);
export const TEST_RESULTS_POLLING_RATE_MS = parseInt(
  (urlParams.get("polling_rate") ?? urlParams.get("measure") === "true")
    ? "10"
    : "500",
);

export const SUPPORTER_OPERATORS_COMPONENT_NAME = `${TEST_RUNNER_NAME}.SupportedOperators`;

export const OPERATOR_PATH_SEP = "/";
export const MODULE_PATH_SEP = ".";

export const DEFAULT_UNIT_TEST: UnitTest = {
  name: "Test",
  systems: [],
  initialConfiguration: [],
  expectedConfiguration: [],
  operators: [],
};

export const DEFAULT_TEST_PROPERTIES: UnitTestProps = {
  test: DEFAULT_UNIT_TEST,
  selectedModules: [],
};

export const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  tests: [],
};
