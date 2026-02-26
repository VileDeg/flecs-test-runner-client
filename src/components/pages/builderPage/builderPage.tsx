import React, { useState, useEffect, useRef } from "react";
import { useFlecsConnection } from "@common/flecsConnection/useFlecsConnection.ts";
import { TestRunner } from "@common/testRunner.ts";
import { useWorkspace } from "@/contexts/workspaceContext.tsx";
import { ModuleSelector } from "./moduleSelector.tsx";
import { SystemsList } from "./systemsList.tsx";
import { WorldBuilderComponent } from "@pages/builderPage/worldBuilder.tsx";
import { useToast } from "@/components/common/toast/useToast.ts";

import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { 
  Download, 
  Play, 
  Trash2, 
  FileText, 
  Layers, 
  Loader2,
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

import {
  type Module,
  type EntityConfiguration,
  type WorldConfiguration,
  type SystemInvocation,
  MessageType,
} from "@/common/types";


import * as Utils from "@/common/testUtils.ts"

import {
  DEFAULT_TEST_PROPERTIES,
} from "@common/constants.ts";
import { TestStatus, type WorkspaceTest } from "@/common/workspaceTypes.ts";
import { useBuilder } from "@/contexts/builderContext.tsx";

export interface TestBuilderProps {
  goToWorkspacePage: () => void;
}

export const TestBuilder: React.FC<TestBuilderProps> = ({
  goToWorkspacePage
}) => {
  const { showToast } = useToast();
  const { connection } = useFlecsConnection();
  const { 
    currentTestId: maybeCurrentTestId, 
    getWorkspaceTest,
    saveToWorkspace,
    //updateWorkspaceTest,
    //runTest,
    runTestIncomplete,
    //validateTest,
  } = useWorkspace();

  
  const renderEmptyDisplay = (content: any) => (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold text-foreground mb-8">Test Builder</h1>
      <div className="text-center py-12">
        <div className="bg-muted rounded-lg p-8 max-w-md mx-auto">
          {content}
        </div>
      </div>
    </div>
  )

  const renderLoadingDisplay = (text: any) => (
    renderEmptyDisplay(
      //<h2 className="text-xl font-semibold mb-4">Test Is Currently Running. Wait...</h2>
      <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground">{text}</p>
    </div>
    )
  )

  if (!maybeCurrentTestId) {
    return renderEmptyDisplay(<>
      <h2 className="text-xl font-semibold mb-4">No Test Selected</h2>
      <p className="text-muted-foreground mb-6">
        Please select a test from the workspace to edit, or create a new test in the workspace first.
      </p>
      <Button 
        variant="outline" 
        onClick={goToWorkspacePage}
      >
        Go to Workspace
      </Button>
    </>)
  }
  
  const currentTestId = maybeCurrentTestId!;
  const currentStatus = getWorkspaceTest(currentTestId)!.status;

  if (currentStatus === TestStatus.RUNNING) { //  
    return renderLoadingDisplay("Test Is Currently Running. Wait...")
  }

  const {
    availableModules,
    availableSystems,
    //availableComponents,
    loadingMetadata,
    testProperties,//: contextTestProperties,
    updateTestProperties,
    updateUnitTest,
  } = useBuilder();

  if (loadingMetadata) {
    return renderLoadingDisplay("Loading Metadata...")
  }

    // Create a ref to track the latest properties
  // const latestPropertiesRef = useRef(latestPcontextTestPropertiesroperties);

  // // Sync ref on every render
  // useEffect(() => {
  //   latestPropertiesRef.current = testProperties;
  // }, [testProperties]);

  const {test, selectedModules} = testProperties;

  // useEffect(() => {
  //   console.log("testProperties: ", testProperties)
  // }, [testProperties]);
    

  // Helper setters
  const setSelectedModules = (selectedModules: Module[]) => {
    console.log(`setSelectedModules: `, testProperties, selectedModules)
    updateTestProperties({...testProperties, selectedModules}) // setTestProperties
  }
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [jsonPreview, setJsonPreview] = useState("");
  
  // State for incomplete test execution (expected state generation)
  const [genStatus, setGenStatus] = useState<{ loading: boolean; msg: string }>({
    loading: false,
    msg: ""
  });

  
  const setTestName = (name: string) => {
    updateUnitTest({name});
  }

  const setSystems = (systems: SystemInvocation[]) => {
    updateUnitTest({systems});
  }

  const setInitialConfiguration = (entities: WorldConfiguration) => {
    //console.log("setInitialConfiguration")
    updateUnitTest({initialConfiguration: entities});
  }

  const setExpectedConfiguration = (entities: WorldConfiguration) => {
    updateUnitTest({expectedConfiguration: entities});
  }

  const { name: testName, systems, initialConfiguration, expectedConfiguration } = test;

 

  // Update JSON preview live whenever form data changes
  useEffect(() => {
    setJsonPreview(JSON.stringify(testProperties, null, 2));
  }, [testProperties, setJsonPreview]);

  // const downloadWorkspaceTest = () => {
  //   if(!currentTestId) {
  //     throw Error("Missing current test ID")
  //   }
  //   /*
  //   updateWorkspaceTest(currentTestId, {testProperties})
  //   */
  //   let wsTest = getWorkspaceTest(currentTestId)
  //   if(!wsTest) {
  //     throw Error("No workspace test found with ID: " + currentTestId)
  //   }
  //   wsTest = {...wsTest, testProperties, lastUpdated: Date.now() }

  //   const filename = wsTest.testProperties.test.name;
  //   Utils.downloadJson(wsTest, filename)
  //   showToast(`File "${filename}.json" downloaded successfully!`, 'success');
  // };

  // const saveToWorkspace = () => {
  //   try {
  //     if(!validateTest(test, true)) {
  //       showToast(`Test "${test.name}" was not saved`, 'warning');
  //       return;
  //     }
  //     updateWorkspaceTest(currentTestId!, { testProperties });
  //     showToast(`Test "${test.name}" saved to workspace`, 'success');
  //   } catch (error: any) {
  //     console.error("Error saving test to workspace:", error);
  //     showToast(`Error saving test to workspace: ${error.message}`, 'error');
  //   }
  // };

  // const handleRunTest = async () => {
  //   let wsTest = getWorkspaceTest(currentTestId!);
  //   if (!wsTest) {
  //     console.error("Test not found");
  //     return
  //   }
  //   saveToWorkspace(currentTestId!, testProperties)
    
  //   //saveToWorkspace(); // save current test
  //   wsTest = {...wsTest, testProperties}
  //   runTest(wsTest);
    
  //   // const messages = Utils.validateTest(test, true)
  //   // if(messages.length > 0) {
  //   //   messages.forEach(msg => showToast(msg, 'warning'))
  //   //   return;
  //   // }

  //   // const result = await Utils.runTest(connection!, test)
  //   // if(result.success) {
  //   //   showToast(`Test "${testName}" started successfully`, 'success');
  //   // } else {
  //   //   showToast(`Error running test: ${result.message ?? "unknown"}`, 'error');
  //   // }
  // };

  // const fillExpectedFromInitial = async () => {
  //   //let { name: testName , systems, initialConfiguration } = testProperties;

  //   if(!validateTest(test, false)) {
  //     setGenStatus({loading: false, msg: "Invalid"});
  //     return;
  //   }
  //   // const messages = Utils.validateTest(test, false);
  //   // if(messages.length > 0) {
  //   //   messages.forEach(msg => showToast(msg, 'warning'))
  //   //   return;
  //   // }

  //   setGenStatus({loading: true, msg: "Executing..."});

  //   try {
  //     const testRunner = new TestRunner(connection!); // TODO: what if conn == null?
  //     const incompleteTestName = `${testName.trim()}_incomplete_${Date.now()}`;
      
  //     // Execute incomplete test
  //     await testRunner.executeIncompleteTest( // const executeResult = 
  //       incompleteTestName,
  //       systems.map(s => ({
  //         name: s.name.trim(),
  //         timesToRun: s.timesToRun
  //       })),
  //       initialConfiguration
  //     );
      
  //     // if (!executeResult.success) {
  //     //   showToast(executeResult.message, 'error');
  //     //   setGenStatus({loading: false, msg: ""});
  //     //   return;
  //     // }
      
  //     setGenStatus({loading: true, msg: "Waiting for results..."});
      
  //     // Poll for results
  //     // TODO: get values from constants
  //     const pollResult = await testRunner.pollForIncompleteTestResult(
  //       incompleteTestName,
  //       15000,
  //       500    // poll every 500ms
  //     );
      
  //     if ("error" in pollResult) {
  //       showToast(pollResult.error, 'error');
  //       return;
  //     }

  //     const {incomplete, executed, passed} = pollResult;

  //     const status = executed.statusMessage;

  //     if(!passed) {
  //       showToast("Failed to execute incomplete test: " + status, 'error');
  //       return;
  //     }

  //     // Parse the serialized world into EntityData array
  //     const parsedEntities = TestRunner.parseWorldSerialized(incomplete.worldExpectedSerialized, availableComponents);
      
  //     if (parsedEntities.length > 0) {
  //       setExpectedConfiguration(parsedEntities);
  //       showToast(`Expected state generated successfully!`, 'success');
  //     } else {
  //       showToast("Failed to parse expected state from serialized world", 'error');
  //     }
      
  //   } catch (error: any) {
  //     console.error("Error generating expected state:", error);
  //     showToast(`Error generating expected state: ${error.message}`, 'error');
  //   }
  //   setGenStatus({loading: false, msg: ""});
  // };

  const clearForm = () => {
    updateTestProperties(DEFAULT_TEST_PROPERTIES);
  };

  const renderWorldBuilder = (
    //cardTitle: string, 
    worldConfiguration: WorldConfiguration, 
    onUpdateWorldConfiguration: (worldConfiguration: WorldConfiguration) => void,
    isExpectedConfig: boolean = false
  ) => (
    // <Card>
    //   <CardHeader>
    //     <CardTitle>{cardTitle}</CardTitle>
    //   </CardHeader>
    //   <CardContent>
    <>
        {selectedModules.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground italic">
            Select at least one module to see available components
          </div>
        ) : (
          <WorldBuilderComponent
            configuration={worldConfiguration}
            onUpdate={onUpdateWorldConfiguration}
            isExpected={isExpectedConfig}
          />
        )}
    </>
      //</CardContent>
    //</Card>
  )

  const renderSystemsRegion = () => (
    <Card>
      <CardHeader>
        <CardTitle>Systems to Run</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedModules.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground italic">
            Please select at least one module to see available systems
          </div>
        ) : availableSystems.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground italic">
            No systems found in selected modules
          </div>
        ) : (
          <SystemsList
            selectedSystems={systems}
            availableSystems={availableSystems}
            onUpdateSystems={(systems) => {setSystems(systems)}}
          />
        )}
      </CardContent>
    </Card>
  )

  const renderWorldBuilders = () => (
    <div className={"grid grid-cols-2 gap-4"}>
      {
        renderWorldBuilder(
          //"Initial State (Entities & Components)", 
          initialConfiguration, 
          (conf) => {setInitialConfiguration(conf)}
        )
      }
      {
        renderWorldBuilder(
          //"Expected State (Entities & Components)", 
          expectedConfiguration, 
          (conf) => {setExpectedConfiguration(conf)},
          true // isExpectedConfig
        )
      }
    </div>
  )

  const renderTestName = () => (
    <Card>
      <CardHeader>
        <CardTitle>Test Name</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Input
            type="text"
            value={testName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestName(e.target.value)}
            placeholder="Enter test name"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  )

  const handleSaveToWorkspace = () => {
    saveToWorkspace(currentTestId, testProperties);
    showToast(`Test ${testName} saved to workspace`, MessageType.INFO)
  }

  const renderButtons = () => (
    <div className="flex flex-col flex-wrap gap-4 items-start justify-end">
      <Button 
        variant="destructive" 
        onClick={clearForm}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Clear Form
      </Button>
      
      <Button 
        variant="outline" 
        onClick={() => runTestIncomplete(currentTestId, testProperties)}
        disabled={genStatus.loading} //  || !testName.trim() || systems.length === 0 || initialConfiguration.length === 0
        className="gap-2"
      >
        {genStatus.loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Layers className="h-4 w-4" />
        )}
        {genStatus.loading ? genStatus.msg : "Generate Expected from Initial"}
      </Button>
      
      {/* <Button 
        variant="default" 
        onClick={downloadWorkspaceTest}
        disabled={!testName.trim()} //  || systems.length === 0
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Download JSON
      </Button> */}
      
      <Button 
        variant="default" 
        onClick={handleSaveToWorkspace}
        disabled={!testName.trim()} //  || systems.length === 0
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Save to Workspace
      </Button>
      
      {/* <Button 
        variant="default"
        onClick={handleRunTest}
        disabled={!testName.trim()} //  || systems.length === 0
        className="gap-2 bg-green-600 hover:bg-green-700"
      >
        <Play className="h-4 w-4" />
        Run Test
      </Button> */}
    </div>
  )

  const renderPreview = () => (
    <Card className="w-full"> {/**sticky top-24 */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          JSON Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {jsonPreview ? (
          <pre className="bg-black dark:bg-gray-900 text-white dark:text-gray-200 p-4 rounded-md overflow-auto text-sm max-h-[500px]">
            {jsonPreview}
          </pre>
        ) : (
          <div className="text-center py-8 text-muted-foreground italic">
            Fill in the form to see JSON preview
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderLoadingMetadata = () => (
    <Card>
      <CardContent className="py-8">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Loading metadata...</p>
        </div>
      </CardContent>
    </Card>
  )

  const renderTopRow = () => (
    <>
    {/* Top Grid: Metadata, Buttons, and Preview */}
    <div 
      className={`grid gap-12 items-start ${
        isPreviewOpen 
          ? 'lg:grid-cols-[auto_auto_1fr]' // 1. Columns hug content, Preview takes rest
          : 'lg:grid-cols-[auto_auto_auto]' // 2. Everything hugs content
      }`}
    >
      {/* Column 1: Metadata Builders */}
      <div className="space-y-6 w-fit justify-self-end">
        <ModuleSelector
          availableModules={availableModules}
          selectedModules={selectedModules}
          onSelectionChange={setSelectedModules}
          loading={false}
        />

        {renderTestName()}

        {loadingMetadata && renderLoadingMetadata()}
        {!loadingMetadata && renderSystemsRegion()}
      </div>

      {/* Column 2: Action Buttons */}
      <div className="flex flex-col h-full items-start">
        <div className="grow" />
        {renderButtons()}
      </div>

      {/* Column 3: The Collapsible Preview */}
      <div className="flex items-start gap-2 sticky top-24 justify-self-end">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-md border flex-shrink-0"
          onClick={() => setIsPreviewOpen(!isPreviewOpen)}
        >
          {isPreviewOpen ? <ChevronRight /> : <ChevronLeft />}
        </Button>

        {isPreviewOpen && (
          <div className="w-full animate-in slide-in-from-right-4 duration-200">
            {renderPreview()}
          </div>
        )}
      </div>
    </div>
    </>
  )

  

  return (
    <div className="space-y-8">
      {renderTopRow()}
  
      {/* Bottom Section: World Builders (Full Width) */}
      
      <div className="pt-4 border-t">
        {renderWorldBuilders()}
      </div>
    </div>
  );
}
