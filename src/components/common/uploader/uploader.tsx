import { useCallback } from "react";
import { useDropzone } from "react-dropzone";



import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/workspaceContext";
import { TestRunner } from "@common/testRunner.ts";
import { useFlecsConnection } from "@common/flecsConnection/useFlecsConnection.ts";
import { useToast } from "@/components/common/toast/useToast";

import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
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
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";

import { type WorkspaceTest, TestStatus, isWorkspaceTest} from "@/common/workspaceTypes";
import * as Utils from "@/common/testUtils";


import type { 
  UnitTest,
  UnitTestProps,
  QueryResponse,
  QueriedEntity,
} from "@/common/types";

import { 
  isUnitTestProps,
  MessageType,
} from "@/common/types";

import { 
  UNIT_TEST_EXECUTED_TAG_NAME, 
  UNIT_TEST_PASSED_TAG_NAME, 
  UNIT_TEST_INCOMPLETE_TAG_NAME 
} from "@common/constants.ts";

interface UploaderProps {
  onTestsParsed : (tests: UnitTestProps[]) => void;
}

// TODO: allow supplying multiple files, merge all files to get a list of the tests
/*
JSON may start with `tests` array or may only contain one test element 
(starts with `name` property of the test)
*/


export const Uploader: React.FC<UploaderProps> = ({ onTestsParsed  }) => {
  const { showToast } = useToast();
  
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => { // Why is async?
      const allTests: UnitTestProps[] = [];

      for (const file of acceptedFiles) {
        try {
          const text = await file.text();
          const json = JSON.parse(text);

          // Handle multiple formats:
          if (Array.isArray(json)) {
            // Validate each test in the array
            json.forEach((test: any) => {
              if(!isUnitTestProps(test)) {
                // TODO: show correct structure example
                showToast(
                  `File ${file.name} has incorrect test structure inside array of tests. \
                  Skipping...`, 
                  MessageType.ERROR
                );
                return
              }
              allTests.push(test);
            });
          } else if (isUnitTestProps(json)) {
            allTests.push(json);
          } else {
            showToast(
              `File ${file.name} has incorrect test structure. \
              Skipping...`, 
              MessageType.ERROR
            );
          }
        } catch (e: any) {
          showToast(
            `Error parsing ${file.name}. Is not a valid JSON file: ${e.message} \
            Skipping...`, 
            MessageType.ERROR
          );
          //console.error(`Error parsing ${file.name}:`, e);
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
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
        isDragActive 
          ? "border-primary bg-primary/10" 
          : "border-border bg-card hover:border-primary/50",
        "hover:bg-card/80"
      )}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-foreground m-0">Drop the JSON file here ...</p>
      ) : (
        <p className="text-foreground m-0">Drag and drop JSON files here, or click to select</p>
      )}

      {fileRejections.length > 0 && (
        <p className="text-destructive mt-4 text-sm font-medium">
          Only .json files are accepted
        </p>
      )}
    </div>
  );
};

export default Uploader;