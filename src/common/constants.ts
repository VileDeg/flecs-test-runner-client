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

export const TEST_EXECUTION_TIMEOUT_MS = 10000;

// Low polling rate for more accurate measurement
const urlParams = new URLSearchParams(window.location.search);
const isMeasureForced = urlParams.get("measure") === "true";
export const TEST_RESULTS_POLLING_RATE_MS = isMeasureForced ? 10 : 500;

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

/**
 * Default workspace state
 */
export const DEFAULT_WORKSPACE_STATE: WorkspaceState = {
  tests: [],
};
