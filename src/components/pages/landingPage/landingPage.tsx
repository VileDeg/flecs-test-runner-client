import { Uploader } from "@ui/uploader/uploader.tsx";
import { TestRunner, type FlecsCore } from "@common/testRunner.ts";

import { useState } from 'react'

import {
  ErrorBox,
  TestsList,
  Button,
} from "./styles.ts";

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
  const [tests, setTests] = useState<FlecsCore.UnitTest[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const { connection } = useFlecsConnection();
  
  const onTestsParsed = (tests: FlecsCore.UnitTest[]) => {
    setTests(tests);
    runUnitTests(tests);
    onTestsUploaded();
  };
  
  const runUnitTests = async (testsToRun: FlecsCore.UnitTest[]) => {
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
    <div>
      {errorMessage && <ErrorBox>{errorMessage}</ErrorBox>}

      <Uploader onTestsParsed={onTestsParsed} />
    
      {tests.length > 0 && (
        <>
          <TestsList>
            {tests.map((t) => (
              <li key={t.name}>
                <strong>{t.name}</strong> - {t.systems.map((s) => s.name).join(", ")}
              </li>
            ))}
          </TestsList>

          <Button onClick={() => runUnitTests(tests)}>Run Again</Button>
        </>
      )}
    </div>
  );
};