import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { TestRunner } from "@common/testRunner.ts";
import { DropzoneContainer, DropzoneText, ErrorMessage } from "./styles.ts";

import type * as Core from "@common/coreTypes.ts";

interface UploaderProps {
  onTestsParsed : (tests: Core.UnitTest[]) => void;
}

// TODO: allow supplying multiple files, merge all files to get a list of the tests
/*
JSON may start with `tests` array or may only contain one test element 
(starts with `name` property of the test)
*/


export const Uploader: React.FC<UploaderProps> = ({ onTestsParsed  }) => {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const allTests: Core.UnitTest[] = [];

      for (const file of acceptedFiles) {
        try {
          const text = await file.text();
          const json = JSON.parse(text);

          // Handle multiple formats:
          // 1) { tests: [ ... ] } - array of tests
          // 2) { name, systems, scriptActual, scriptExpected } - single test
          
          if (Array.isArray(json.tests)) {
            // Validate each test in the array
            json.tests.forEach((test: any) => {
              const validation = TestRunner.validateTest(test);
              if (validation.valid) {
                allTests.push(test);
              } else {
                console.warn(`Invalid test in ${file.name}:`, validation.errors);
              }
            });
          } else if (json.name && json.systems) {
            // Single test - validate format
            const validation = TestRunner.validateTest(json);
            if (validation.valid) {
              allTests.push(json);
            } else {
              console.warn(`Invalid test structure in ${file.name}:`, validation.errors);
            }
          } else {
            console.warn(`File ${file.name} has invalid structure - must have 'name' and 'systems' properties`);
          }
        } catch (e) {
          console.error(`Error parsing ${file.name}:`, e);
        }
      }

      // Pass the combined list to the parent
      onTestsParsed(allTests);
    },
    [onTestsParsed]
  );


  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      accept: {
        "application/json": [".json"], // <-- accept only JSON files
      },
      multiple: true,
    });

  return (
    <DropzoneContainer
      {...getRootProps()}
      $isDragActive={isDragActive}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <DropzoneText>Drop the JSON file here ...</DropzoneText>
      ) : (
        <DropzoneText>Drag and drop a JSON file here, or click to select one</DropzoneText>
      )}

      {fileRejections.length > 0 && (
        <ErrorMessage>Only .json files are accepted</ErrorMessage>
      )}
    </DropzoneContainer>
  );
};

export default Uploader;
