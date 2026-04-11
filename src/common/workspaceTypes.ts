import type { UnitTestProps } from "./types";

import { isUnitTestProps } from "@/common/types";

/**
 * Test status types
 */
export const TestStatus = {
  RUNNING: "running",
  PASSED: "passed",
  FAILED: "failed",
  TIMEOUT: "timeout",
  INVALID: "invalid", // when test did not pass validation
  IDLE: "idle", // not displayed in UI?
} as const;
export type TestStatus = (typeof TestStatus)[keyof typeof TestStatus];

/**
 * Extended test information for workspace management
 */
export interface WorkspaceTest {
  /** Unique identifier for the test in workspace */
  id: string;
  /** The actual test data */
  testProperties: UnitTestProps;
  /** Current status of the test */
  status: TestStatus;
  /** Last status message from execution */
  statusMessage?: string;
  /** Timestamp when test was last updated */
  lastUpdated: number;
  /** Timestamp when test was created/added to workspace */
  createdAt: number;

  executedAtEpochMs?: number;
}

export function isWorkspaceTest(value: unknown): value is WorkspaceTest {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    isUnitTestProps(candidate.testProperties) &&
    Object.values(TestStatus).includes(candidate.status as TestStatus) &&
    typeof candidate.lastUpdated === "number" &&
    typeof candidate.createdAt === "number" &&
    // Optional/Nullable properties
    (candidate.statusMessage === undefined ||
      typeof candidate.statusMessage === "string") &&
    (candidate.executedAtEpochMs === undefined ||
      typeof candidate.executedAtEpochMs === "number")
  );
}
/**
 * Workspace state stored in localStorage
 */
export interface WorkspaceState {
  /** All tests in the workspace */
  tests: WorkspaceTest[];
}

export function isWorkspaceState(value: unknown): value is WorkspaceState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;

  return (
    Array.isArray(candidate.tests) &&
    !candidate.tests.find((something) => !isWorkspaceTest(something))
  );
}

/**
 * Polling configuration
 */
export interface PollingConfig {
  /** Polling interval in milliseconds */
  interval: number;
  /** Whether polling is enabled */
  enabled: boolean;
  /** Timeout for individual poll requests */
  timeout: number;
}

/**
 * Default polling configuration
 */
export const DEFAULT_POLLING_CONFIG: PollingConfig = {
  interval: 5000, // 5 seconds
  enabled: true,
  timeout: 10000, // 10 seconds
};
