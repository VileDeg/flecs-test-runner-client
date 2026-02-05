import React, { useEffect, useState } from "react";
import { Timer } from "@ui/timer/timer.tsx";
import { useFlecsConnection } from "@common/flecsConnection/useFlecsConnection.ts";
import * as Core from "@common/coreTypes.ts";

import { 
  UNIT_TEST_EXECUTED_TAG_NAME, 
  UNIT_TEST_PASSED_TAG_NAME, 
  UNIT_TEST_INCOMPLETE_TAG_NAME 
} from "@common/constants.ts";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestResult {
  name: string;
  statusMessage?: string;
}

export const ResultsPage: React.FC = () => {
  const [pendingTests, setPendingTests] = useState<TestResult[]>([]);
  const [passedTests, setPassedTests] = useState<TestResult[]>([]);
  const [failedTests, setFailedTests] = useState<TestResult[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingStartTime, setPendingStartTime] = useState<number | null>(null);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const { connection } = useFlecsConnection();

  // Poll with smart timing and timeout
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchResults = async () => {
      try {
        if (!connection) return;

        // Get pending tests (UnitTest but not Executed)
        const pendingQuery = await connection.query(
          `TestRunner.UnitTest, !${UNIT_TEST_EXECUTED_TAG_NAME}, !${UNIT_TEST_INCOMPLETE_TAG_NAME}`, {}
        );
        const newPendingTests = parseQueryResults(pendingQuery, "Not executed yet");

        // Get passed tests (UnitTest with Executed and Passed components)
        const passedQuery = await connection.query(
          `TestRunner.UnitTest, ${UNIT_TEST_EXECUTED_TAG_NAME}, ${UNIT_TEST_PASSED_TAG_NAME}, !${UNIT_TEST_INCOMPLETE_TAG_NAME}`, {}
        );
        const newPassedTests = parseQueryResults(passedQuery, "Test passed");

        // Get failed tests (UnitTest with Executed but without Passed component)
        const failedQuery = await connection.query(
          `TestRunner.UnitTest, ${UNIT_TEST_EXECUTED_TAG_NAME}, !${UNIT_TEST_PASSED_TAG_NAME}, !${UNIT_TEST_INCOMPLETE_TAG_NAME}`, {}
        );
        const newFailedTests = parseQueryResults(failedQuery, "Test failed");

        // If we have pending tests and no start time, set it
        if (newPendingTests.length > 0 && pendingStartTime === null) {
          setPendingStartTime(Date.now());
          setHasTimedOut(false);
        }
        
        // If no pending tests, clear the start time
        if (newPendingTests.length === 0) {
          setPendingStartTime(null);
          setHasTimedOut(false);
        }
        
        // Check for timeout (2 minutes = 120,000ms)
        if (pendingStartTime !== null && Date.now() - pendingStartTime > 120000) {
          setHasTimedOut(true);
          setPendingStartTime(null);
        }

        setPendingTests(newPendingTests);
        setPassedTests(newPassedTests);
        setFailedTests(newFailedTests);
        setErrorMessage("");
      } catch (err: any) {
        setErrorMessage(`Error fetching results: ${err.message}`);
      }
    };

    // Initial fetch
    fetchResults();

    // Only poll if we have pending tests and haven't timed out
    if (!hasTimedOut) {
      interval = setInterval(fetchResults, 1000); // 1 second interval
    }

    return () => clearInterval(interval);
  }, [connection, pendingTests.length, pendingStartTime, hasTimedOut]);

  // Clear all test results
  const clearAllTests = async () => {
    if (!connection) return;
    
    setIsClearing(true);
    setErrorMessage("");
    
    try {
      // Query all entities with UnitTest component
      const allTestsQuery = await connection.query(
        "TestRunner.UnitTest", {}
      );
      
      if (allTestsQuery && allTestsQuery.results) {
        // Delete each test entity
        const deletePromises = allTestsQuery.results.map((entity: any) => 
          connection.delete(entity.name)
        );
        
        await Promise.all(deletePromises);
        
        // Clear local state
        setPendingTests([]);
        setPassedTests([]);
        setFailedTests([]);
        setPendingStartTime(null);
        setHasTimedOut(false);
      }
    } catch (err: any) {
      setErrorMessage(`Error clearing tests: ${err.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  // Helper function to parse query results into TestResult array
  const parseQueryResults = (queryResult: any, defaultStatusMessage: string): TestResult[] => {
    const results: TestResult[] = [];
    
    if (queryResult && queryResult.results) {
      for (const entity of queryResult.results) {
        const components = entity.fields.values;
        const unitTest: Core.UnitTest = components[0];
        const executed: Core.UnitTest.Executed | undefined = components[1];
        
        results.push({
          name: unitTest.name,
          statusMessage: executed?.statusMessage || defaultStatusMessage
        });
      }
    }
    
    return results;
  };

  // Render test table for a specific status
  const renderTestTable = (testList: TestResult[], status: "pending" | "passed" | "failed") => {
    if (testList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground italic">
          No {status} tests
        </div>
      );
    }

    const statusColors = {
      pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      passed: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
      failed: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
    };

    return (
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className={cn("border-b border-border", statusColors[status])}>
            <tr>
              <th className="text-left p-4 font-semibold">Test Name</th>
              <th className="text-left p-4 font-semibold">Status Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {testList.map((t) => (
              <tr key={t.name} className="hover:bg-muted/50 transition-colors">
                <td className="p-4 font-medium">{t.name}</td>
                <td className="p-4 text-muted-foreground">{t.statusMessage ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getStatusIcon = (status: "pending" | "passed" | "failed") => {
    switch (status) {
      case "pending": return <Clock className="h-5 w-5" />;
      case "passed": return <CheckCircle className="h-5 w-5" />;
      case "failed": return <XCircle className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: "pending" | "passed" | "failed") => {
    switch (status) {
      case "pending": return "text-yellow-600 dark:text-yellow-400";
      case "passed": return "text-green-600 dark:text-green-400";
      case "failed": return "text-red-600 dark:text-red-400";
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Unit Test Results</h1>
          <p className="text-muted-foreground mt-2">
            Monitor the execution status of your tests
          </p>
        </div>
        
        <Button 
          variant="destructive"
          onClick={clearAllTests}
          disabled={isClearing || (pendingTests.length === 0 && passedTests.length === 0 && failedTests.length === 0)}
          className="w-full md:w-auto"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isClearing ? 'Clearing...' : 'Clear All Tests'}
        </Button>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {hasTimedOut && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Test execution timed out after 2 minutes</AlertDescription>
        </Alert>
      )}

      <div className="space-y-8">
        {pendingTests.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon("pending")}
                  <CardTitle className={getStatusColor("pending")}>
                    Pending Tests ({pendingTests.length})
                  </CardTitle>
                </div>
                {pendingStartTime && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                      <Timer startTime={pendingStartTime} />
                    </Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {renderTestTable(pendingTests, "pending")}
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {getStatusIcon("passed")}
              <CardTitle className={getStatusColor("passed")}>
                Passed Tests ({passedTests.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {renderTestTable(passedTests, "passed")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {getStatusIcon("failed")}
              <CardTitle className={getStatusColor("failed")}>
                Failed Tests ({failedTests.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {renderTestTable(failedTests, "failed")}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};