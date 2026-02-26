import type { UnitTest, UnitTestProps } from "./types";

import type { 
  Module,
} from "@/common/types";

import { 
  isUnitTestProps,
} from "@/common/types";


/**
 * Test status types
 */
export const TestStatus = {
  //PENDING: 'pending', // TODO: remove?
  RUNNING: 'running',
  PASSED: 'passed',
  FAILED: 'failed',
  TIMEOUT: 'timeout',
  INVALID: 'invalid', // when test did not pass validation
  IDLE: 'idle', // not displayed in UI?
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
  /** Modules selected for the test */
  //modules: Module[];
}

export function isWorkspaceTest(value: any): value is WorkspaceTest {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.id === "string" &&
    isUnitTestProps(value.testProperties) &&
    Object.values(TestStatus).includes(value.status) &&
    typeof value.lastUpdated === "number" &&
    typeof value.createdAt === "number" &&
    // Optional/Nullable properties
    (value.statusMessage === undefined || typeof value.statusMessage === "string") &&
    (value.executedAtEpochMs === undefined || typeof value.executedAtEpochMs === "number")
  );
}
/**
 * Workspace state stored in localStorage
 */
export interface WorkspaceState {
  /** All tests in the workspace */
  tests: WorkspaceTest[];
  /** ID of the test currently open in builder (if any) */
  //currentTestId: string | null; // TODO: remove
  /** Last time workspace was synced with Flecs */
  //lastSyncTime: number | null;
}

export function isWorkspaceState(value: any): value is WorkspaceState {
  return typeof value === "object" &&
    value !== null &&
    Array.isArray(value.tests) && 
    !value.tests.find((something: any) => !isWorkspaceTest(something))
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

