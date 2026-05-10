/**
 * @file
 * Types used in workspace context and page.
 */

import type { UnitTestProps } from "./types";

import { isUnitTestProps } from "@/common/types";

/**
 * Test status types,
 */
export const TestStatus = {
  RUNNING: "running",
  PENDING: "pending",
  PASSED: "passed",
  FAILED: "failed",
  TIMEOUT: "timeout",
  INVALID: "invalid", // When test did not pass validation
  IDLE: "idle",
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
  /** Timestamp when test was executed */
  executedAtEpochMs?: number;
}

/**
 * Workspace state stored in localStorage
 */
export interface WorkspaceState {
  /** All tests in the workspace */
  tests: WorkspaceTest[];
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

export function isWorkspaceState(value: unknown): value is WorkspaceState {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;

  return (
    Array.isArray(candidate.tests) &&
    !candidate.tests.find((something) => !isWorkspaceTest(something))
  );
}

export const SortType = {
  Alphabetical: "alphabetical",
  Status: "status",
  Chronological: "chronological",
} as const;
export type SortType = (typeof SortType)[keyof typeof SortType];

export const SortDirection = {
  Ascending: "asc",
  Descending: "desc",
} as const;
export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];
