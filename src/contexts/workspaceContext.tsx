import React, { createContext, useContext, useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import type { WorkspaceTest, WorkspaceState } from "@/common/workspaceTypes";
import { TestStatus } from "@/common/workspaceTypes";
import { isWorkspaceState } from "@/common/workspaceTypes";
import { DEFAULT_WORKSPACE_STATE, DEFAULT_TEST_PROPERTIES, OPERATOR_PATH_SEP } from "@common/constants"

import { useFlecsConnection } from "@contexts/flecsConnectionContext";

import * as LS from "@/common/localStorage";
import type { UnitTestProps, System, Component, TestValidationResult } from "@/common/types";
import { MessageType } from "@/common/types";

import { useToast } from "@contexts/toastContext";
import * as Utils from "@/common/testUtils";

import { useMetadataLoader } from "@/contexts/metadataLoaderContext";

import type { 
  UnitTest,
  QueryResponse,
} from "@/common/types";

import { 
  UNIT_TEST_EXECUTED_TAG_NAME, 
  UNIT_TEST_PASSED_TAG_NAME, 
  UNIT_TEST_INCOMPLETE_TAG_NAME,
  TEST_EXECUTION_TIMEOUT_MS
} from "@common/constants.ts";

import { TestRunner } from "@/common/testRunner";


interface WorkspaceContextType {
  // State
  state: WorkspaceState;
  currentTestId: string | null;
  isPolling: boolean;
  
  refreshCurrentTest: boolean;
  // Actions
  getWorkspaceTest: (id: string) => WorkspaceTest | undefined;
  addEmptyWorkspaceTest: () => WorkspaceTest;
  saveToWorkspace: (id: string, testProperties: UnitTestProps) => void;
  removeWorkspaceTest: (id: string) => void;
  setCurrentWorkspaceTestId: (string: string | null) => void;
  clearWorkspaceTests: () => void;
  
  // Bulk operations
  addWorkspaceTests: (tests: UnitTestProps[]) => void;
  runTest: (testId: string) => Promise<boolean>;
  runTestIncomplete: (testId: string, testProps: UnitTestProps) => Promise<boolean>;
  runMultipleTests: (tests: WorkspaceTest[]) => Promise<boolean>;

  setIsPolling: (isPolling: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// LocalStorage key
const WORKSPACE_STORAGE_KEY = "workspaceState" // "workspaceTests";

interface TestResult {
  name: string;
  statusMessage: string;
  worldExpectedSerialized?: string;
}

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [wsState, setWsState] = useState<WorkspaceState>(
    LS.get(WORKSPACE_STORAGE_KEY, isWorkspaceState, DEFAULT_WORKSPACE_STATE)
  );

  const { connection } = useFlecsConnection();
  const [isPolling, setIsPolling] = useState(false);
  
  const [currentTestId, setCurrentTestId] = useState<string | null>(null);

  const { showToast } = useToast();

  const refreshCurrentTestRef = useRef(false);
  
  useEffect(() => {
    // Save to localStorage whenever tests change
    LS.set(WORKSPACE_STORAGE_KEY, wsState);
  }, [wsState]);

  const {
    availableModules,
    moduleMetadataMap,
    loadingMetadata,
  } = useMetadataLoader();

  const { availableSystems, availableComponents } = useMemo(() => {
    let availableSystems: System[] = []
    let availableComponents: Component[] = []
    if(!loadingMetadata) {
      availableModules.forEach(module => {
        if(!moduleMetadataMap.has(module.fullPath)) {
          // Cannot happen
          console.error("Internal Error: module ", module.fullPath, " is not in the map ", moduleMetadataMap); 
          return;
        }
        const md = moduleMetadataMap.get(module.fullPath)!;
        availableSystems.push(...md.systems)
        availableComponents.push(...md.components)
      }) 
    }
    console.log("availableSystems: ", availableSystems)
    return {availableSystems, availableComponents}
  }, [loadingMetadata, availableModules, moduleMetadataMap])

  const testsRef = useRef(wsState.tests);

  // Update the ref every time the state changes
  useEffect(() => {
    testsRef.current = wsState.tests;
  }, [wsState.tests]);

  const generateTestId = (): string => {
    return crypto.randomUUID();
  };

  /**
   * Create a workspace test from a UnitTest
   */
  const createWorkspaceTest = (props: UnitTestProps): WorkspaceTest => {
    return {
      id: generateTestId(),
      testProperties: props,
      status: TestStatus.IDLE,
      lastUpdated: Date.now(),
      createdAt: Date.now(),
    };
  }

  const getTest = (id: string): WorkspaceTest => {
    const wsTest = wsState.tests.find(test => test.id == id);
    if(!wsTest) {
      throw Error(`Cannot find test with id ${id}`)
    }
    return wsTest
  };

  const addEmptyTest = (): WorkspaceTest => {
    const emptyTest: UnitTestProps = {
      ...DEFAULT_TEST_PROPERTIES,
      test: {
        ...DEFAULT_TEST_PROPERTIES.test, 
        name: `New Test ${wsState.tests.length + 1}` // Note: This index might still be off in a loop
      }
    };
    const workspaceTest = createWorkspaceTest(emptyTest);
    
    setWsState(prev => ({
      ...prev,
      tests: [...prev.tests, workspaceTest]
    }));
    
    return workspaceTest;
  };

  const addTests = (testsToAdd: UnitTestProps[]) => {
    console.log("testsToAdd: ", testsToAdd)

    setWsState(prev => {
      const newWsTests = testsToAdd.map(testProps => createWorkspaceTest(testProps));
      const combinedTests = [...prev.tests];

      console.log("totalTests BEFORE: ", combinedTests)

      newWsTests.forEach(wsTest => {
        combinedTests.push(wsTest)
        validateTest(wsTest, true, combinedTests);
      })
      console.log("totalTests AFTER: ", combinedTests)
     
      return {
        ...prev,
        tests: combinedTests
      }
    });
  };

  // Update a test
  const updateTest = (id: string, updates: Partial<WorkspaceTest>) => {
    setWsState((prev) => ({
      ...prev,
      tests: prev.tests.map((test) =>
        test.id === id ? { ...test, ...updates, lastUpdated: Date.now() } : test
      ),
    }));
  };

  const displayValidationResults = (results: TestValidationResult[]) => {
    results.forEach(result => showToast(result.message, result.type ?? MessageType.ERROR))
  }

  const saveToWorkspace = (id: string, testProperties: UnitTestProps) => {
    let wsTest = getTest(id);
    wsTest.testProperties = testProperties;
    wsTest.lastUpdated = Date.now();

    const results = validateTest(wsTest, true)
    
    displayValidationResults(results)
    updateTest(id, wsTest)
  };

  // Remove a test
  const removeTest = (id: string) => {
    setWsState((prev) => ({
      ...prev,
      tests: prev.tests.filter(test => test.id !== id)
    }));
  };

  // Clear all tests
  const clearTests = () => {
    setWsState((prev) => ({...prev, tests: []}))
  };

  const convertOperatorsBaseToEntityName = (unitTest: UnitTest): UnitTest => {
    return {
      ...unitTest, 
      operators: unitTest.operators.map(oper => {
        const parts = oper.path.split(OPERATOR_PATH_SEP);
        const entityId = parts[0];
        const newBase = unitTest.expectedConfiguration.find(e => e.id === entityId)?.entityName
        if(!newBase) {
          throw Error(`Entity with id ${entityId} does not exist`)
        }
        parts[0] = newBase;
        return {path: parts.join(OPERATOR_PATH_SEP), type: oper.type};
      })
    };
  }

  const runTest = async (wsTest: WorkspaceTest, clearLastResult: boolean = true): Promise<boolean> => {
    const testId = wsTest.id;
    const unitTest = wsTest.testProperties.test;
    if(wsTest.status === TestStatus.INVALID) {
      showToast(`Test "${unitTest.name}" is not valid. Cannot run.`, MessageType.WARNING);
      return false;
    }
    if(wsTest.status === TestStatus.RUNNING) {
      showToast(`Test "${unitTest.name}" is already running.`, MessageType.WARNING);
      return false;
    }
    try {
      if (!connection) {
        throw new Error("Not connected to Flecs");
      }

      // Here we can be sure that all entity names are unique (ensured by validation)
      const testToRun = convertOperatorsBaseToEntityName(unitTest);

      const testCore = TestRunner.convertTestToCore(testToRun); 
      const testRunner = new TestRunner(connection!);
      await testRunner.executeTest(testCore, clearLastResult);

      console.log("Set to NOW for testId: ", testId);

      updateTest(testId, { 
        status: TestStatus.RUNNING, // Will be later updated by polling
        statusMessage: "Executed successfully", 
        executedAtEpochMs: Date.now()
      });
      showToast(`Test "${unitTest.name}" started successfully`, MessageType.SUCCESS);

      return true;
    } catch (error: any) {
      updateTest(testId, { 
        status: TestStatus.FAILED, 
        statusMessage: error.message 
      });
      const errMsg = `Test "${unitTest.name}" failed to run: ${error.message}`;
      console.error(errMsg)
      showToast(errMsg, MessageType.ERROR);
    }
    return false;
  };

  const runTestIncomplete = async (testId: string, testProps: UnitTestProps) => {
    const wsTest = getTest(testId);
    wsTest.testProperties = testProps;

    const unitTest = wsTest.testProperties.test;

    const results = validateTest(wsTest, false)
    updateTest(testId, wsTest)

    if(results.length > 0) {
      displayValidationResults(results)
      return false;
    }

    try {
      const testRunner = new TestRunner(connection!);

      const coreTest = TestRunner.convertTestToCore({
        ...unitTest,
        expectedConfiguration: [],
        operators: []
      });
      
      // Execute incomplete test
      await testRunner.executeTest(coreTest, true, true);
      updateTest(testId, { 
        status: TestStatus.RUNNING, // Will be later updated by polling
        statusMessage: "Executed successfully", 
        executedAtEpochMs: Date.now()
      });
      showToast(`Test "${unitTest.name}" started successfully`, MessageType.SUCCESS);

      setIsPolling(true);

      return true;
    } catch (error: any) {
      updateTest(testId, { 
        status: TestStatus.FAILED, 
        statusMessage: error.message 
      });
      const errMsg = `Test "${unitTest.name}" failed to run: ${error.message}`;
      console.error(errMsg)
      showToast(errMsg, MessageType.ERROR);
    }
    return false;
  };

  function findDuplicates<T>(arr: T[]): T[] {
    const seen = new Set<T>();
    const duplicates = new Set<T>();
  
    for (const item of arr) {
      if (seen.has(item)) {
        duplicates.add(item);
      } else {
        seen.add(item);
      }
    }
  
    return Array.from(duplicates);
  }

  const validateTest = (
    wsTest: WorkspaceTest, 
    validateExpected: boolean = true, 
    totalTests: WorkspaceTest[] = wsState.tests, 
  ): TestValidationResult[] => {
    const test = wsTest.testProperties.test;
    let results: TestValidationResult[] = []
    if(findDuplicates(totalTests.map(test => test.testProperties.test.name)).includes(test.name)) {
      results.push({message: `Test with name ${test.name} already exists`});
    }

    const modulePathsSet = new Set(availableModules.map(module => module.fullPath))
    wsTest.testProperties.selectedModules.forEach(module => {
      if(!modulePathsSet.has(module.fullPath)) {
        results.push({message: `Module ${module.fullPath} is not available. Removing...`, type: MessageType.WARNING});
      }
    })

    results.push(...Utils.validateTest(test, availableSystems, availableComponents, validateExpected));
    if(results.length > 0) {
      wsTest.status = TestStatus.INVALID;
      wsTest.statusMessage = 
        "Validation failed:\n\t" + 
        results.map(
          res => `${res.type ?? MessageType.ERROR}: ${res.message}`
        ).join("\n\t");
    } else if (wsTest.status === TestStatus.INVALID) {
      wsTest.status = TestStatus.IDLE;
    }

    return results;
  }

  const runSingleTest = async (testId: string): Promise<boolean> => {
    if(await runTest(getTest(testId))) {
      setIsPolling(true);
      return true;
    }
    return false;
  }

  const runMultipleTests = async (wsTests: WorkspaceTest[]): Promise<boolean> => {
    // Clear previous results
    const testRunner = new TestRunner(connection!);
    await testRunner.deleteTestEntities();

    const results = await Promise.all(wsTests.map(test => runTest(test, false)));
    const anyRun = results.some(res => res === true);
    if (anyRun) {
      setIsPolling(true);
    }
    return results.every(res => res === true);
  };

  const updateTestStatus = (testId: string, status: TestStatus, message?: string) => {
    updateTest(testId, message ? {status, statusMessage: message} : {status});
  }
  
  const filterRunningTests = (runningTests: WorkspaceTest[], passed: TestResult[], failed: TestResult[]) => {
    for (const wsTest of runningTests) {
      const unitTest = wsTest.testProperties.test;

      const pr = passed.find(pt => pt.name === unitTest.name)
      if (pr) {
        console.log("Passed result: ", pr)

        if(pr.worldExpectedSerialized) {
          console.log("Incomplete test result: ", pr.worldExpectedSerialized)

          const expected = wsTest.testProperties.test.expectedConfiguration;
          const expectedNew = TestRunner.parseWorldSerialized(pr.worldExpectedSerialized, availableComponents);

          // Incomplete test result
          updateTest(
            wsTest.id, 
            {
              status: TestStatus.IDLE, 
              statusMessage: pr.statusMessage, 
              testProperties: {
                ...wsTest.testProperties, 
                test: {
                  ...unitTest, 
                  expectedConfiguration: expected.map(e => ({
                    ...e,
                    components: expectedNew.find(eNew => eNew.entityName === e.entityName)?.components ?? []
                  }))
                }
              }
            }
          );

          if (wsTest.id === currentTestId) {
            // Refresh current test in builder.
            refreshCurrentTestRef.current = !refreshCurrentTestRef.current;
          }
        } else {
          updateTestStatus(wsTest.id, TestStatus.PASSED, pr.statusMessage)
        }
        continue
      }
      const fr = failed.find(pt => pt.name === unitTest.name)
      if (fr) {
        updateTestStatus(wsTest.id, TestStatus.FAILED, fr.statusMessage)
        continue
      }
      if (wsTest.executedAtEpochMs === undefined) {
        console.error("Internal error executedAtEpochMs is undefined")
        continue
      } 
      if (wsTest.executedAtEpochMs + TEST_EXECUTION_TIMEOUT_MS < Date.now()) {
        console.log("TIMEOUT for ", wsTest.id)
        updateTestStatus(wsTest.id, TestStatus.TIMEOUT, "Execution timed out");
      }

    }
  };

  // Helper function to parse query results into TestResult array
  const parseQueryResults = (queryResult: QueryResponse): TestResult[] => {
    const results: TestResult[] = [];
    
    for (const entity of queryResult.results) {
      const [unitTest, executed, _, incomplete] = 
      entity.fields.values as [UnitTest, UnitTest.Executed, UnitTest.Passed, UnitTest.Incomplete?];

      results.push({
        name: unitTest.name,
        statusMessage: executed.statusMessage,
        worldExpectedSerialized: incomplete?.worldExpectedSerialized
      });
    }
    
    return results;
  };

  const pollTestResults = async () => {
    try {
      if (!connection) {
        return;
      }
  
      // Use the ref to get the absolute latest state
      const currentTests = testsRef.current;
      const runningTests = currentTests.filter(test => test.status === TestStatus.RUNNING);
  
      if (runningTests.length === 0) {
        setIsPolling(false);
        return;
      }
  
      // Execute queries
      const [passedQuery, failedQuery] = await Promise.all([
        connection.query(
          `TestRunner.UnitTest, ${UNIT_TEST_EXECUTED_TAG_NAME},  ${UNIT_TEST_PASSED_TAG_NAME}, ?${UNIT_TEST_INCOMPLETE_TAG_NAME}`
        ),
        connection.query(
          `TestRunner.UnitTest, ${UNIT_TEST_EXECUTED_TAG_NAME}, !${UNIT_TEST_PASSED_TAG_NAME}, ?${UNIT_TEST_INCOMPLETE_TAG_NAME}`
        ) 
      ]);
  
      const passedResults = parseQueryResults(passedQuery);
      const failedResults = parseQueryResults(failedQuery);

      // Filter and update
      filterRunningTests(runningTests, passedResults, failedResults);
    } catch (err: any) {
      console.error("Polling error:", err.message);
    }
  };

  // Start/stop polling
  useEffect(() => {
    let timerId: number;
    let isMounted = true;
  
    const runPoll = async () => {
      // Check if we should still be polling
      if (!isPolling || !isMounted) {
        return;
      }
  
      try {
        // Await the async logic fully
        await pollTestResults();
      } catch (error) {
        console.error("Poll for results failed: ", error);
      } finally {
        // Only schedule the NEXT poll after the current one is DONE
        if (isPolling && isMounted) {
          timerId = setTimeout(runPoll, 5000);
        }
      }
    };
  
    if (isPolling) {
      runPoll();
    }
  
    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, [isPolling]);


  const value: WorkspaceContextType = {
    state: wsState,
    currentTestId,
    isPolling,
    refreshCurrentTest: refreshCurrentTestRef.current,
    getWorkspaceTest: getTest,
    addEmptyWorkspaceTest: addEmptyTest,
    saveToWorkspace,
    removeWorkspaceTest: removeTest,
    setCurrentWorkspaceTestId: setCurrentTestId,
    clearWorkspaceTests: clearTests,
    addWorkspaceTests: addTests,
    runTest: runSingleTest,
    runTestIncomplete,
    runMultipleTests,
    setIsPolling
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};