import { Uploader, type UnitTest } from "../uploader/uploader.tsx";
import { TestRunner, type HierarchicalTest } from "../../common/testRunner.ts";

import { useState } from 'react'

import {
  ErrorBox,
  TestsList,
  RunButton,
} from "./styles.ts";

import { useFlecsConnection } from "../../context/flecsConnection/useFlecsConnection.ts";

interface LandingPageProps {
  onTestsUploaded : () => void;
}

// TODO: allow supplying multiple files, merge all files to get a list of the tests
/*
JSON may start with `tests` array or may only contain one test element 
(starts with `name` property of the test)
*/

export const LandingPage: React.FC<LandingPageProps> = ({ onTestsUploaded }) => {
  const [tests, setTests] = useState<(UnitTest | HierarchicalTest)[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  
  const { connection } = useFlecsConnection();

  /*useEffect(() => {
    if (heartbeat) {
      console.log("Heartbeat:", heartbeat);
    }
  }, [heartbeat]);*/
  
  // 🔍 Check backend connection after mount
  // useEffect(() => {
  
  //     });
  
  const onTestsParsed = (tests: (UnitTest | HierarchicalTest)[]) => {
    setTests(tests);
    runUnitTests(tests);
    onTestsUploaded();
  };
  
  const runUnitTests = async (testsToRun: (UnitTest | HierarchicalTest)[]) => {
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
                <strong>{t.name}</strong> – {t.systems.map((s) => s.name).join(", ")} 
                <span style={{ fontStyle: 'italic', marginLeft: '10px' }}>
                  ({TestRunner.isHierarchicalTest(t) ? 'Hierarchical' : 'Script-based'})
                </span>
              </li>
            ))}
          </TestsList>

          <RunButton onClick={() => runUnitTests(tests)}>Run Again</RunButton>
        </>
      )}
    </div>
  );
};