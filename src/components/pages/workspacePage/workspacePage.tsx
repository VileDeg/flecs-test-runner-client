import React, { useState, useEffect, useCallback, useRef, type JSX } from "react";
import { useWorkspace } from "@/contexts/workspaceContext";
import { Uploader } from "@/components/common/uploader/uploader";
import { TestRunner } from "@common/testRunner.ts";
import { useToast } from "@/components/common/toast/useToast";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import { Checkbox } from "@components/ui/checkbox";
import { 
  Play, 
  PlayCircle, 
  Upload, 
  RefreshCw, 
  Trash2,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  FolderOutput,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Calendar,
  Text,
  List,
  CheckSquare,
  Square,
  Check,
  ArrowRightFromLine,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

import {TestStatus, type WorkspaceTest} from "@/common/workspaceTypes";
import * as Utils from "@/common/testUtils";

import TestListItem from "./testListItem";

import type { 
  UnitTest,
  UnitTestProps,
  QueryResponse,
  QueriedEntity,
} from "@/common/types";


import type { MessageType } from "@/common/types";

import { 
  UNIT_TEST_EXECUTED_TAG_NAME, 
  UNIT_TEST_PASSED_TAG_NAME, 
  UNIT_TEST_INCOMPLETE_TAG_NAME,
  UNIT_TEST_COMPONENT_NAME
} from "@common/constants.ts";
import useFlecsConnection from "@/common/flecsConnection/useFlecsConnection";

const statusPriority: Record<TestStatus, number> = {
  [TestStatus.PASSED]: 0,
  [TestStatus.RUNNING]: 1,
  [TestStatus.FAILED]: 2,
  [TestStatus.TIMEOUT]: 3,
  [TestStatus.INVALID]: 4,
  [TestStatus.IDLE]: 5,
};

const allStatuses = [
  null,
  TestStatus.PASSED,
  TestStatus.RUNNING,
  TestStatus.FAILED,
  TestStatus.TIMEOUT,
  TestStatus.INVALID,
  TestStatus.IDLE,
];

export interface WorkspacePageProps {
  goToBuilderPage: () => void;
}

const sortTypes = ['alphabetical', 'status', 'chronological'] as const;
const sortDirections = ['asc', 'desc'] as const;

type SortType = typeof sortTypes[number];
type SortDirection = typeof sortDirections[number];

interface TestResult {
  name: string,
  passed: boolean,
  status: string,
}

type TestResults = Record<string, TestResult>;

const WorkspacePage: React.FC<WorkspacePageProps> = ({goToBuilderPage}) => {
  const { showToast } = useToast();
  const { connection } = useFlecsConnection();
  const { 
    state,
    isPolling, 
    getWorkspaceTest: getTest,
    addWorkspaceTests: addTests, 
    addEmptyWorkspaceTest: addEmptyTest,
    //updateWorkspaceTest: updateTest, 
    removeWorkspaceTest: removeTest, 
    clearWorkspaceTests: clearTests, 
    runTest, 
    runMultipleTests,
    setCurrentWorkspaceTestId: setCurrentTestId,
    //setIsPolling,
    //setSelectedModules
  } = useWorkspace();

  //const [isClearing, setIsClearing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  
  const [sortType, setSortType] = useState<SortType>('chronological');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<TestStatus | null>(null);

  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null); // TODO: remove

  // Selection helper functions
  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      // Cancel selection mode
      clearSelection()
    }
    setIsSelectionMode(!isSelectionMode);
  };

  const toggleTestSelection = (testId: string, index: number, event: React.MouseEvent) => {
    if (!isSelectionMode) {
      return;
    }

    const newSelectedIds = new Set(selectedTestIds);
    
    // Single click selection
    if (newSelectedIds.has(testId)) {
      newSelectedIds.delete(testId);
    } else {
      //newSelectedIds.clear();
      newSelectedIds.add(testId);
    }
    setSelectedTestIds(newSelectedIds);
    setLastSelectedIndex(index);
  };

  const selectAllVisibleTests = () => {
    const allIds = new Set(wsTests.map(test => test.id));
    setSelectedTestIds(allIds);
  };

  const clearSelection = () => {
    setSelectedTestIds(new Set());
    setLastSelectedIndex(null);
  };

  const isTestSelected = (testId: string) => selectedTestIds.has(testId);
  
  const alphabeticalOrder = (a: WorkspaceTest, b: WorkspaceTest) => {
    const nameA = a.testProperties.test.name.toLowerCase();
    const nameB = b.testProperties.test.name.toLowerCase();
    const comparison = nameA.localeCompare(nameB);
    return sortDirection === 'asc' ? comparison : -comparison;
  }

  const statusOrder = (a: WorkspaceTest, b: WorkspaceTest) => {
    return statusPriority[a.status] - statusPriority[b.status];
  }

  const chronologicalOrder = (a: WorkspaceTest, b: WorkspaceTest) => {
    const timeA = a.lastUpdated;
    const timeB = b.lastUpdated;
    return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
  }

  const getSortOrder = (sortType: SortType) => {
    switch (sortType) {
      case 'alphabetical': {
        return alphabeticalOrder;
      }
      case 'status': {
        return statusOrder;
      }
      default:
        return chronologicalOrder;
    }
  }
  const allTests = state.tests;

  // Get sorted and filtered tests
  const getSortedAndFilteredTests = (): WorkspaceTest[] => {
    let filteredTests = allTests;
    
    // Apply status filter
    if (filterStatus !== null) {
      filteredTests = filteredTests.filter(test => test.status === filterStatus);
    }
    
    // Apply sorting
    return [...filteredTests].sort(getSortOrder(sortType));
  };
  
  // Helper accessor for sorted and filtered tests
  const wsTests = getSortedAndFilteredTests();
  
  // Helper accessor for all tests (unfiltered)


  // const getAllRunningTests = (): WorkspaceTest[] => {
  //   return allTests.filter(test => test.status === TestStatus.RUNNING);
  // }

  const getAllFinishedSelectedTests = (): WorkspaceTest[] => {
    return wsTests.filter(test => test.status === TestStatus.PASSED || test.status === TestStatus.FAILED);
  }

  // const isAnyRunningTests = (): boolean => {
  //   return getAllRunningTests().length > 0;
  // }

  const isAnyFinishedSelectedTests = (): boolean => {
    return getAllFinishedSelectedTests().length > 0;
  }

  // Handle uploaded tests
  const handleTestsUploaded = (uploadedTests: UnitTestProps[]) => {
    if (uploadedTests.length === 0) {
      showToast("No tests found in uploaded files", "error");
      return;
    }

    addTests(uploadedTests); // const workspaceTests = 
    showToast(`Added ${uploadedTests.length} test(s) to workspace`, "success");
  };

  // Handle test execution
  const handleRunTest = async (testId: string) => {
    //const wsTest = wsTests.find(test => test.id == testId)!;
    await runTest(testId)
  };

  // Handle run all tests
  // const handleRunAllTests = async () => {
  //   await runMultipleTests(wsTests)
  // };

  const getSelectedTests = () => {
    return wsTests.filter(test => selectedTestIds.has(test.id));
  }

  // Handle run selected tests
  const handleRunSelectedTests = async () => {
    const selectedTests = getSelectedTests();
    if (selectedTests.length === 0) {
      showToast("No tests selected", "error");
      return;
    }
    await runMultipleTests(selectedTests);
  };

  // Handle export selected tests
  const handleExportSelectedTests = () => {
    const selectedTests = getSelectedTests().map(wsTest => wsTest.testProperties);
    if (selectedTests.length === 0) {
      showToast("No tests selected", "error");
      return;
    }
    Utils.downloadJson(selectedTests, `Tests_${Date.now()}`);
  };

  const makeTestResult = (test: WorkspaceTest): TestResult => {
    return {
      name: test.testProperties.test.name, 
      passed: test.status === TestStatus.PASSED,
      status: test.statusMessage ?? ""
    }
  }

  const handleExportSelectedTestResults = () => {
    let selectedTests = getSelectedTests();
    if (selectedTests.length === 0) {
      showToast("No tests selected", "error");
      return;
    }
    selectedTests = selectedTests.filter(
      test => test.status === TestStatus.PASSED || test.status === TestStatus.FAILED
    )
    
    const results: TestResults = Object.fromEntries(
      selectedTests.map(test => [test.id, makeTestResult(test)])
    )
    Utils.downloadJson(results, `Test_Results_${Date.now()}`)
    //const results = selectedTests.map(test => {{id: test.id, name: test.testProperties.test.name}})
  }

  // Handle clear selected tests
  const handleClearSelectedTests = () => {
    const selectedTests = getSelectedTests();
    if (selectedTests.length === 0) {
      showToast("No tests selected", "error");
      return;
    }
    selectedTests.forEach(test => removeTest(test.id));
    showToast(`Cleared ${selectedTests.length} selected test(s)`, "success");
    clearSelection();
  };

  // const handleClearAllResults = async () => {
  //   if (!connection) {
  //     return;
  //   }
        
  //   setIsClearing(true);
    
  //   try {
  //     // Query all entities with UnitTest component
  //     const allTestsQuery = await connection.query(
  //       UNIT_TEST_COMPONENT_NAME, {}
  //     );
      
  //     // Delete each test entity
  //     const deletePromises = allTestsQuery.results.map((entity) => 
  //       connection.delete((entity as QueriedEntity).name)
  //     );
      
  //     await Promise.all(deletePromises);
        
  //   } catch (err: any) {
  //     showToast(`Error clearing tests: ${err.message}`, MessageType.ERROR);
  //   }
  //   setIsClearing(false);
  // }

  // const handleExportAllTests = () => {
  //   Utils.downloadJson(wsTests, `Tests_${Date.now()}`)
  // };

  const handleExportTest = async (testId: string) => {
    const wsTest = getTest(testId);
    if(!wsTest) {
      throw Error(`Test with ID ${testId} was not found`)
    }
    const props = wsTest.testProperties
    Utils.downloadJson(props, props.test.name);
  };

  const renderCollapseToggle = () => (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8" 
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </Button>
  )

  const renderSelectionModeButtons = () => (
    <>
      <Button 
        variant="default"
        onClick={handleRunSelectedTests}
        disabled={selectedTestIds.size === 0}
        className="gap-2"
      >
        <PlayCircle className="h-4 w-4" />
        Run
      </Button>

      <Button 
        variant="outline"
        onClick={handleExportSelectedTestResults}
        disabled={selectedTestIds.size === 0 || !isAnyFinishedSelectedTests()}
        className="gap-2"
      >
        <ArrowRightFromLine className="h-4 w-4" />
        Export Results
      </Button>

      <Button 
        variant="outline"
        onClick={handleExportSelectedTests}
        disabled={selectedTestIds.size === 0}
        className="gap-2"
      >
        <FolderOutput className="h-4 w-4" />
        Export
      </Button>

      <Button 
        variant="destructive"
        onClick={handleClearSelectedTests}
        disabled={selectedTestIds.size === 0}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
    </>
  )
  const renderHeader = () => (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Test Workspace</h1>
        <p className="text-muted-foreground mt-2">
          Manage and monitor your unit tests
        </p>
      </div>
  
      {/* Vertical container to stack button rows */}
      <div className="flex flex-col items-end gap-3">
        
        {/* Row 1: Primary Actions */}
        <div className="flex flex-wrap gap-2">
          {/* <Button 
            variant="outline"
            onClick={() => setIsPolling(!isPolling)}
            // className="gap-2"
            className={cn(
              "gap-2",
              !isAnyRunningTests() && "opacity-50 pointer-events-none"
            )}
          >
            <RefreshCw className={cn("h-4 w-4", isPolling && "animate-spin")} />
            {isPolling ? "Polling..." : "Start Polling"}
          </Button> */}
  
          <Button 
            variant="outline"
            onClick={() => {
              const newTest = addEmptyTest();
              setCurrentTestId(newTest.id);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Test
          </Button>
  
          <Button 
            variant={isSelectionMode ? "destructive" : "outline"}
            onClick={toggleSelectionMode}
            className="gap-2"
          >
            {isSelectionMode ? (
              <><Square className="h-4 w-4" /> Cancel Selection</>
            ) : (
              <><CheckSquare className="h-4 w-4" /> Selection Mode</>
            )}
          </Button>
        </div>
  
        {/* Row 2: Selection Mode Actions */}
        {isSelectionMode && (
          <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            {renderSelectionModeButtons()}
          </div>
        )}
      </div>
    </div>
  );

  const renderUploadSection = () => (
    <Card className="m-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Tests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Uploader onTestsParsed={handleTestsUploaded} />
        <p className="text-sm text-muted-foreground mt-4">
          Upload JSON files containing one or multiple tests. Tests will be added to your workspace.
        </p>
      </CardContent>
    </Card>
  )

  const handleOnSortTypeToggleClicked = () => {
    // Simple toggle between sort types
    const currentIndex = sortTypes.indexOf(sortType);
    const nextIndex = (currentIndex + 1) % sortTypes.length;
    setSortType(sortTypes[nextIndex]);
    // Reset direction to default for new sort type
    if (sortTypes[nextIndex] === 'chronological') {
      setSortDirection('desc');
    } else {
      setSortDirection('asc');
    }
  }

  const renderSortTypeToggle = () => (
    <div className="relative inline-block w-full">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 gap-1"
        onClick={handleOnSortTypeToggleClicked}
        title={`Sort by: ${sortType}`}
      >
        {sortType === 'alphabetical' && <Text className="h-3 w-3" />}
        {sortType === 'status' && <List className="h-3 w-3" />}
        {sortType === 'chronological' && <Calendar className="h-3 w-3" />}
        <span className="text-xs capitalize">{sortType}</span> {/*.slice(0, 4) */}
      </Button>
    </div>
  )

  const renderSortDirectionToggle = () => (
    <>
    {(sortType === 'alphabetical' || sortType === 'chronological') && (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
        title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
      >
        {sortDirection === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )}
      </Button>
    )}
    </>
  )

  const handleOnStatusFilterToggleClicked = () => {
    const currentIndex = allStatuses.indexOf(filterStatus);
    const nextIndex = (currentIndex + 1) % allStatuses.length;
    setFilterStatus(allStatuses[nextIndex]);
  }

  const renderStatusFilterToggle = () => (
    <div className="relative inline-block">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 gap-1"
        onClick={handleOnStatusFilterToggleClicked}
        title={`Filter: ${filterStatus === null ? 'None' : filterStatus}`}
      >
        <Filter className="h-3 w-3" />
        <span className="text-xs">
          {filterStatus === null ? 'All' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
        </span>
      </Button>
    </div>
  )

  // const renderTestListHeader = () => {
  //   const visibleTestCount = wsTests.length;
  //   const selectedCount = selectedTestIds.size;
  //   const allVisibleSelected = selectedCount > 0 && selectedCount === visibleTestCount;
  //   const someVisibleSelected = selectedCount > 0 && selectedCount < visibleTestCount;

  //   return (
  //     <CardHeader>
  //       <div className="flex flex-row items-center justify-between w-full">
  //         <div className="flex items-center gap-2">
  //           {renderCollapseToggle()}
  //           <CardTitle className="flex items-center gap-2">
  //             {isSelectionMode ? (
  //               <>
  //                 <CheckSquare className="h-5 w-5" />
  //                 Selected ({selectedCount}/{visibleTestCount}{filterStatus !== null && `/${allTests.length}`})
  //               </>
  //             ) : (
  //               <>
  //                 <FileText className="h-5 w-5" />
  //                 Tests ({visibleTestCount}{filterStatus !== null && `/${allTests.length}`})
  //               </>
  //             )}
  //           </CardTitle>
  //           {isSelectionMode && (
  //             <div className="flex items-center gap-2 ml-2">
  //               <Checkbox
  //                 checked={allVisibleSelected}
  //                 onCheckedChange={(checked) => {
  //                   if (checked) {
  //                     selectAllVisibleTests();
  //                   } else {
  //                     clearSelection();
  //                   }
  //                 }}
  //                 className={cn(
  //                   "h-4 w-4",
  //                   someVisibleSelected && "data-[state=checked]:bg-primary/50"
  //                 )}
  //               />
  //               <span className="text-sm text-muted-foreground">
  //                 Select all
  //               </span>
  //             </div>
  //           )}
  //         </div>
  //         <div className="flex items-center gap-2">
  //           {/* Sorting and filtering controls */}
  //           <div className={cn(
  //             "flex items-center gap-1 border-r border-border pr-2 mr-2",
  //             isSelectionMode && "opacity-50 pointer-events-none"
  //           )}>
  //             {renderSortDirectionToggle()}
  //             {renderSortTypeToggle()}
  //           </div>
  //           <div className={cn(
  //             isSelectionMode && "opacity-50 pointer-events-none"
  //           )}>
  //             {renderStatusFilterToggle()}
  //           </div>
            
  //           <Badge variant="outline" className={cn(
  //             "font-medium",
  //             isPolling && "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
  //           )}>
  //             {isPolling ? (
  //               <>
  //                 <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
  //                 Polling Active
  //               </>
  //             ) : (
  //               "Polling Inactive"
  //             )}
  //           </Badge>
  //         </div>
  //       </div>
  //     </CardHeader>
  //   );
  // }

  const renderPollingBadge = () => (
    <Badge variant="outline" className={
      "font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
    }>
      <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> 
      Polling For Results
      {/* {isPolling ? (
        <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Polling For Results</>
      ) : (
        "Polling Inactive"
      )} */}
    </Badge>
  )

  const renderTestStats = () => {
    const totalCount = allTests.length;
    const passedCount = allTests.filter(t => t.status === TestStatus.PASSED).length;
    const failedCount = allTests.filter(t => t.status === TestStatus.FAILED).length;
    return <div className="flex items-center gap-4 text-sm font-medium">
      <span className="text-muted-foreground">
        Total: <span className="text-foreground">{totalCount}</span>
      </span>
      
      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
        <CheckCircle className="h-4 w-4" />
        Passed: <span>{passedCount}</span>
      </span>

      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
        <XCircle className="h-4 w-4" />
        Failed: <span>{failedCount}</span>
      </span>
    </div>
  }

  const renderTestListHeader = () => {
    const visibleTestCount = wsTests.length;
    const selectedCount = selectedTestIds.size;
    const allVisibleSelected = selectedCount > 0 && selectedCount === visibleTestCount;
    const someVisibleSelected = selectedCount > 0 && selectedCount < visibleTestCount;

    return (
      <CardHeader>
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {renderCollapseToggle()}
              <CardTitle className="flex items-center gap-2">
                {isSelectionMode ? (
                  <>
                    <CheckSquare className="h-5 w-5" />
                    Selected ({selectedCount}/{visibleTestCount})
                  </>
                ) : (
                  <>
                    <FileText className="h-5 w-5" />
                    Tests
                  </>
                )}
              </CardTitle>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {!isSelectionMode && renderTestStats()}

            {isSelectionMode && (
              <div className="flex items-center gap-2 ml-2">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={(checked) => {
                    if (checked) selectAllVisibleTests();
                    else clearSelection();
                  }}
                  className={cn(
                    "h-4 w-4",
                    someVisibleSelected && "data-[state=checked]:bg-primary/50"
                  )}
                />
                <span className="text-sm text-muted-foreground">Select all</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isPolling && renderPollingBadge()}
            <div className={cn(
              "flex items-center gap-1 border-r border-border pr-2 mr-2",
              isSelectionMode && "opacity-50 pointer-events-none"
            )}>
              {renderSortDirectionToggle()}
              {renderSortTypeToggle()}
            </div>
            <div className={cn(isSelectionMode && "opacity-50 pointer-events-none")}>
              {renderStatusFilterToggle()}
            </div>
          </div>
        </div>
      </CardHeader>
    );
  }

  const renderTestList = () => (
    <CardContent>
      {wsTests.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No tests in workspace</h3>
          <p className="text-muted-foreground">
            Upload tests using the uploader above or create new tests in the builder.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {wsTests.map((wsTest, index) => {
            return (
              <TestListItem
                key={wsTest.id}
                wsTest={wsTest}
                onRunTest={handleRunTest}
                onRemoveTest={removeTest}
                onSelectTest={(testId) => {
                  setCurrentTestId(testId);
                  goToBuilderPage();
                }}
                onExportTest={handleExportTest}
                // Selection mode props
                index={index}
                isSelectionMode={isSelectionMode}
                isSelected={isTestSelected(wsTest.id)}
                onToggleSelection={toggleTestSelection}
              />
            );
          })}
        </div>
      )}
    </CardContent>
  )

  const renderTestListCard = () => (
    <Card>
      {renderTestListHeader()}
      {isExpanded && renderTestList()}
    </Card>
  )
  
  // const renderStats = () => (
  //   <div className="m-4 grid grid-cols-1 md:grid-cols-4 gap-4">
  //     <Card>
  //       <CardContent className="pt-2">
  //         <div className="text-center">
  //           <div className="text-2xl font-bold text-foreground">{allTests.length}</div>
  //           <div className="text-sm text-muted-foreground">Total Tests</div>
  //         </div>
  //       </CardContent>
  //     </Card>
      
  //     <Card>
  //       <CardContent className="pt-2">
  //         <div className="text-center">
  //           <div className="text-2xl font-bold text-green-600 dark:text-green-400">
  //             {allTests.filter(t => t.status === TestStatus.PASSED).length}
  //           </div>
  //           <div className="text-sm text-muted-foreground">Passed</div>
  //         </div>
  //       </CardContent>
  //     </Card>
      
  //     <Card>
  //       <CardContent className="pt-2">
  //         <div className="text-center">
  //           <div className="text-2xl font-bold text-red-600 dark:text-red-400">
  //             {allTests.filter(t => t.status === TestStatus.FAILED).length}
  //           </div>
  //           <div className="text-sm text-muted-foreground">Failed</div>
  //         </div>
  //       </CardContent>
  //     </Card>
      
  //     <Card>
  //       <CardContent className="pt-2">
  //         <div className="text-center">
  //           <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
  //             {allTests.filter(t => t.status === TestStatus.RUNNING).length}
  //           </div>
  //           <div className="text-sm text-muted-foreground">Pending/Running</div>
  //         </div>
  //       </CardContent>
  //     </Card>
  //   </div>
  // )

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {renderHeader()}
      {/* {wsTests.length > 0 && renderStats()} */}
      {renderTestListCard()}
      {renderUploadSection()}
    </div>
  );
};

export default WorkspacePage;