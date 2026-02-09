import type { TestProperties } from "./types";

export const FLECS_PORT = 27750
export const BASE_URL = `http://localhost:${FLECS_PORT}`;
export const UNIT_TEST_COMPONENT_NAME = "TestRunner.UnitTest";
export const UNIT_TEST_READY_TAG_NAME = "TestRunner.UnitTest.Ready";
export const UNIT_TEST_INCOMPLETE_TAG_NAME = "TestRunner.UnitTest.Incomplete";
export const UNIT_TEST_EXECUTED_TAG_NAME = "TestRunner.UnitTest.Executed";
export const UNIT_TEST_PASSED_TAG_NAME = "TestRunner.UnitTest.Passed";

export const DEFAULT_TEST_PROPERTIES: TestProperties = {
  name: "",
  systems: [],
  initialConfiguration: [],
  expectedConfiguration: [],
};

// TODO: move content to testRunner file?
