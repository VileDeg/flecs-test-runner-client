import { Uploader } from "@/components/common/uploader/uploader";
import { TestRunner } from "@common/testRunner.ts";
import type * as Core from "@/common/types";

import { useState } from 'react'
import { AlertCircle, Play } from "lucide-react";

import { Alert, AlertDescription } from "@components/ui/alert";
import { Button } from "@components/ui/button";

import { useFlecsConnection } from "@common/flecsConnection/useFlecsConnection.ts";

interface LandingPageProps {
  onTestsUploaded : () => void;
}

// TODO: allow supplying multiple files, merge all files to get a list of the tests
/*
JSON may start with `tests` array or may only contain one test element 
(starts with `name` property of the test)
*/

export const LandingPage: React.FC<LandingPageProps> = ({ onTestsUploaded }) => {
  const [tests, setTests] = useState<UnitTest[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const { connection } = useFlecsConnection();
  
  const onTestsParsed = (tests: UnitTest[]) => {
    setTests(tests);
    runUnitTests(tests);
    onTestsUploaded();
  };
  
  const runUnitTests = async (testsToRun: UnitTest[]) => {
    setErrorMessage("");
    
    try {
      const testRunner = new TestRunner(connection);
      const results = await testRunner.executeTests(testsToRun);
      
      // Check if any tests failed
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        setErrorMessage(
          `Some tests failed to execute:\n${failures.map(f => f.message).join('\n')}`
        );
      } else {
        console.log(`✅ All ${results.length} tests created successfully.`);
      }
    } catch (error: any) {
      console.error("Error running tests:", error);
      setErrorMessage(`Error running tests: ${error.message}`);
    }
  };
  
  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Uploader onTestsParsed={onTestsParsed} />
    
      {tests.length > 0 && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Uploaded Tests</h3>
            <ul className="space-y-3">
              {tests.map((t) => (
                <li key={t.name} className="p-3 bg-muted/50 rounded-md border border-border">
                  <div className="font-medium text-foreground">{t.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Systems: {t.systems.map((s) => s.name).join(", ")}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={() => runUnitTests(tests)} className="w-full sm:w-auto">
            <Play className="h-4 w-4 mr-2" />
            Run Again
          </Button>
        </div>
      )}
    </div>
  );
};