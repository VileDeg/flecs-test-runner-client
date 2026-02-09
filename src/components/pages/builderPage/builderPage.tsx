import React, { useState, useEffect } from "react";
import { useFlecsConnection } from "@common/flecsConnection/useFlecsConnection.ts";
import { FlecsMetadataService } from "@common/flecsMetadataService.ts";
import { TestRunner } from "@common/testRunner.ts";
import { ModuleSelector } from "./moduleSelector.tsx";
import { SystemsList } from "./systemsList.tsx";
import { WorldBuilderComponent } from "@pages/builderPage/worldBuilder.tsx";
import { useToast } from "@ui/toast/useToast.ts";
import { useTestBuilderState } from "@hooks/useTestBuilderState.ts";
import { useModuleSelection } from "@hooks/useModuleSelection.ts";
import { type TestBuilderPersistedState} from "@hooks/useTestBuilderState.ts";

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
} from "lucide-react";

import type { 
  TestProperties,
  PrimitiveType,
  System,
  Component,
  QueryResponse,
  QueriedEntity,
  MetaComponentRegistry,
  ComponentField,
  ComponentFieldValue,
  ComponentFields,
  EntityConfiguration,
  WorldConfiguration,
  ComponentsRegistry,
  SystemInvocation,
} from "@/common/types";
import { error } from "console";

export interface TestBuilderProps {
  onTestCreated?: () => void;
  persistedState?: TestBuilderPersistedState;
  onStateChange?: (state: TestBuilderPersistedState) => void;
}

export const TestBuilder: React.FC<TestBuilderProps> = ({ 
  onTestCreated, 
  persistedState,
  onStateChange,
}) => {
  const { showToast } = useToast();
  const { connection } = useFlecsConnection();

  console.log(" BUILDER PAGE OBJECT CREATED")
  
  // Use custom hooks for state management
  const {
    testProperties,
    setTestProperties,
    selectedModules,
    setSelectedModules,
  } = useTestBuilderState(persistedState, onStateChange);

  const {
    availableModules,
    availableSystems,
    availableComponents,
    loading: loadingModules,
    loadingMetadata,
  } = useModuleSelection(selectedModules);
  
  const [jsonPreview, setJsonPreview] = useState("");
  
  // State for incomplete test execution (expected state generation)
  const [isGeneratingExpected, setIsGeneratingExpected] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState("");
  
  // State for layout toggle (side-by-side vs stacked)
  const [stackedStateLayout, setStackedStateLayout] = useState(true);

  const setTestName = (name: string) => {
    setTestProperties({...testProperties, name});
  }

  const setSystems = (systems: SystemInvocation[]) => {
    setTestProperties({...testProperties, systems});
  }

  const setInitialConfiguration = (entities: WorldConfiguration) => {
    console.log("setInitialConfiguration")
    setTestProperties({...testProperties, initialConfiguration: entities});
  }

  const setExpectedConfiguration = (entities: WorldConfiguration) => {
    setTestProperties({...testProperties, expectedConfiguration: entities});
  }


  const { name: testName, systems, initialConfiguration, expectedConfiguration } = testProperties;

  useEffect(() => {
    // Don't run until modules have finished loading
    if (loadingModules) { 
      return;
    }

    // If not persisted, initialize selectedModules with all modules
    if(persistedState?.selectedModules === undefined) {
      console.log("Setting selectedModules to all available")
      setSelectedModules(availableModules);
    } else {
      console.log("*** useEffect, availableModules: ", availableModules);
      // Filter out selected that are not in available 
      // Compare by fullPath since Module objects from localStorage may not be the same instances
      const availableModulePaths = new Set(availableModules.map(m => m.fullPath));
      const filteredSelected = selectedModules.filter(m => 
        availableModulePaths.has(m.fullPath)
      );

      console.log("*** useEffect, filteredSelected: ", filteredSelected);
      if (filteredSelected.length !== selectedModules.length) {
        setSelectedModules(filteredSelected);
      }
    }
  }, [availableModules, loadingModules, setSelectedModules]); // , setSelectedModules 

  // Clear systems from modules that are no longer selected
  useEffect(() => {
    if (loadingModules || loadingMetadata) { 
      return;
    }

    if (systems.length > 0) {
      const availableSystemNames = new Set(availableSystems.map(s => s.module + "." + s.name));
      const filteredSystems = systems.filter(s => availableSystemNames.has(s.name));

      console.log("*** Filtering systems, systems before filtering: ", systems);
      console.log("*** Filtering systems, availableSystemNames: ", availableSystemNames);
      console.log("*** Filtering systems, filteredSystems: ", filteredSystems);
      if (filteredSystems.length !== systems.length) {
        setSystems(filteredSystems);
      }
    }
  }, [availableSystems, loadingModules, loadingMetadata, setTestProperties]); //, setSystems

  // Clear components from entities that are no longer available in selected modules
  useEffect(() => {
    if (loadingModules || loadingMetadata) { 
      return;
    }

    const availableComponentNames = new Set(availableComponents.map(c => c.name));
    const filterEntities = (entities: EntityConfiguration[]) => {
      return entities.map(entity => ({
        ...entity,
        components: entity.components.filter(comp => availableComponentNames.has(comp.name))
      }));
    };

    const filteredInitial = filterEntities(initialConfiguration);
    const filteredExpected = filterEntities(expectedConfiguration);

    console.log("*** Filtering ENTITIES INITIAL, BEFORE filtering: ", initialConfiguration);
    console.log("*** Filtering ENTITIES INITIAL, AVAILABLE components: ", availableComponentNames);
    console.log("*** Filtering ENTITIES INITIAL, AFTER filtering: ", filteredInitial);
    
    if (JSON.stringify(filteredInitial) !== JSON.stringify(initialConfiguration)) {
      setInitialConfiguration(filteredInitial);
    }
    if (JSON.stringify(filteredExpected) !== JSON.stringify(expectedConfiguration)) {
      setExpectedConfiguration(filteredExpected);
    }
  }, [availableComponents, loadingModules, loadingMetadata, setTestProperties]); // , setInitialConfiguration, setExpectedConfiguration


  
  const validationFail = (errorMessage: string) : boolean => {
    showToast(errorMessage, 'error');
    return false;
  }

  const validateTest = (validateExpected: boolean) : boolean => {
    if (!testName.trim()) {
      return validationFail("Test name is required");
    }
    if (systems.length === 0) {
      return validationFail("At least one system is required");
    }
    if (systems.some(s => !s.name.trim())) {
      return validationFail("All systems must have names");
    }
    if (initialConfiguration.length === 0) {
      return validationFail("Initial configuration can not be empty");
    }
    if (validateExpected && expectedConfiguration.length === 0) {
      return validationFail("Expected configuration can not be empty");
    }
    return true;
  }

  // Generate UnitTest from form data
  const generateTest = (validate: boolean = true) => {
    if (validate && !validateTest(true)) {
      return null;
    }

    return TestRunner.createTest(
      testName.trim(),
      systems.map(s => ({
        name: s.name.trim(),
        timesToRun: s.timesToRun
      })),
      initialConfiguration,
      expectedConfiguration
    );
  };

  // Update JSON preview live whenever form data changes
  useEffect(() => {
    const test = generateTest(false);
    if (test) {
      setJsonPreview(JSON.stringify(test, null, 2));
    } else {
      setJsonPreview("");
    }
  }, [testProperties, setJsonPreview]);

  const downloadJson = () => {
    const test = generateTest(true);
    if (!test) {
      return;
    }

    const blob = new Blob([JSON.stringify(test, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${test.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`JSON file "${test.name}.json" downloaded successfully!`, 'success');
  };

  const runTest = async () => {
    const test = generateTest(true);
    if (!test) {
      return;
    }

    try {
      const testRunner = new TestRunner(connection);
      const result = await testRunner.executeTest(test);
      
      if (result.success) {
        showToast(result.message, 'success');
        if (onTestCreated) {
          onTestCreated();
        }
      } else {
        showToast(result.message, 'error');
      }
    } catch (error: any) {
      console.error("Error running test:", error);
      showToast(`Error running test "${test.name}": ${error.message}`, 'error');
    }
  };


  const fillExpectedFromInitial = async () => {
    //let { name: testName , systems, initialConfiguration } = testProperties;
    validateTest(false);

    setIsGeneratingExpected(true);
    setGeneratingMessage("Creating incomplete test...");

    try {
      const testRunner = new TestRunner(connection);
      const incompleteTestName = `${testName.trim()}_incomplete_${Date.now()}`;
      
      // Execute incomplete test
      const executeResult = await testRunner.executeIncompleteTest(
        incompleteTestName,
        systems.map(s => ({
          name: s.name.trim(),
          timesToRun: s.timesToRun
        })),
        initialConfiguration
      );
      
      if (!executeResult.success) {
        showToast(executeResult.message, 'error');
        setIsGeneratingExpected(false);
        setGeneratingMessage("");
        return;
      }
      
      setGeneratingMessage("Test running... Waiting for results...");
      
      // Poll for results
      const pollResult = await testRunner.pollForIncompleteTestResult(
        incompleteTestName,
        30000, // 30 second timeout
        500    // poll every 500ms
      );
      
      if (pollResult.success && pollResult.worldSerialized) {
        // Parse the serialized world into EntityData array
        const parsedEntities = TestRunner.parseWorldSerialized(pollResult.worldSerialized);
        
        if (parsedEntities.length > 0) {
          setExpectedConfiguration(parsedEntities);
          showToast(`Expected state generated successfully! Found ${parsedEntities.length} entities.`, 'success');
        } else {
          showToast("Failed to parse expected state from serialized world", 'error');
        }
      } else {
        showToast(pollResult.error || "Failed to retrieve expected state from test execution", 'error');
      }
      
    } catch (error: any) {
      console.error("Error generating expected state:", error);
      showToast(`Error generating expected state: ${error.message}`, 'error');
    } finally {
      setIsGeneratingExpected(false);
      setGeneratingMessage("");
    }
  };

  const clearForm = () => {
    setTestName("");
    setSystems([]);
    setInitialConfiguration([]);
    setExpectedConfiguration([]);
    setJsonPreview("");
  };

  const renderWorldBuilder = (
    cardTitle: string, 
    worldConfiguration: WorldConfiguration, 
    onUpdateWorldConfiguration: (worldConfiguration: WorldConfiguration) => void,
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedModules.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground italic">
            Please select at least one module to see available components
          </div>
        ) : (
          <WorldBuilderComponent
            worldConfiguration={worldConfiguration}
            availableComponents={availableComponents}
            onUpdateWorldConfiguration={onUpdateWorldConfiguration}
          />
        )}
      </CardContent>
    </Card>
  )

  const renderTestProperties = () => (
    <>
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

      <div className={stackedStateLayout ? "space-y-8" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
        {
          renderWorldBuilder(
            "Initial State (Entities & Components)", 
            initialConfiguration, 
            (conf) => {setInitialConfiguration(conf)}
          )
        }

        {
          renderWorldBuilder(
            "Expected State (Entities & Components)", 
            expectedConfiguration, 
            (conf) => {setExpectedConfiguration(conf)}
          )
        }
      </div>
    </>
  )

  const renderTestPropertiesForm = () => (
    <>
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

      {loadingMetadata ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Loading metadata...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        renderTestProperties() 
      )}
    </>
  )

  const renderButtons = () => (
    <div className="flex flex-wrap gap-4">
        <Button 
          variant="outline" 
          onClick={clearForm}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear Form
        </Button>
        
        <Button 
          variant="outline" 
          onClick={fillExpectedFromInitial}
          disabled={isGeneratingExpected || !testName.trim() || systems.length === 0 || initialConfiguration.length === 0}
          className="gap-2"
        >
          {isGeneratingExpected ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Layers className="h-4 w-4" />
          )}
          {isGeneratingExpected ? generatingMessage : "Generate Expected from Initial"}
        </Button>
        
        <Button 
          variant="default" 
          onClick={downloadJson}
          disabled={!testName.trim() || systems.length === 0}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download JSON
        </Button>
        
        <Button 
          variant="default" 
          onClick={runTest}
          disabled={!testName.trim() || systems.length === 0}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Play className="h-4 w-4" />
          Run Test
        </Button>
      </div>
  )

  const renderPreview = () => (
    <Card className="sticky top-8">
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

  if (loadingModules) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold text-foreground mb-8 text-center">Test Builder</h1>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading modules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold text-foreground mb-8">Test Builder</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
        <div className="space-y-8">
          <ModuleSelector
            availableModules={availableModules}
            selectedModules={selectedModules}
            onSelectionChange={setSelectedModules}
            loading={false}
          />

          <>
            { renderTestPropertiesForm() }
          </>

          <>
            { renderButtons() }
          </>
        </div>

        <>
          { renderPreview() }
        </>
      </div>
    </div>
  );
}
