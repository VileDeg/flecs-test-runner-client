import React, { useState, useEffect } from "react";
import { useFlecsConnection } from "@common/flecsConnection/useFlecsConnection.ts";
import { FlecsMetadataService } from "@common/flecsMetadataService.ts";
import { TestRunner } from "@common/testRunner.ts";
import type * as Core from "@common/coreTypes.ts";
import { ModuleSelector } from "./moduleSelector.tsx";
import { SystemsList } from "./systemsList.tsx";
import { EntityBuilderComponent } from "./entityBuilder.tsx";
import { useToast } from "@ui/toast/useToast.ts";
import { useTestBuilderState } from "@hooks/useTestBuilderState.ts";
import { useModuleSelection } from "@hooks/useModuleSelection.ts";
import { type TestBuilderPersistedState} from "@hooks/useTestBuilderState.ts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { 
  Download, 
  Play, 
  Trash2, 
  FileText, 
  Layers, 
  Grid3x3,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  AlertCircle
} from "lucide-react";

export interface TestBuilderProps {
  onTestCreated?: () => void;
  persistedState?: TestBuilderPersistedState;
  onStateChange?: (state: TestBuilderPersistedState) => void;
}

export const TestBuilder: React.FC<TestBuilderProps> = ({ 
  onTestCreated, 
  persistedState,
  onStateChange 
}) => {
  const { showToast } = useToast();
  const { connection } = useFlecsConnection();
  
  // Use custom hooks for state management
  const {
    testName,
    setTestName,
    systems,
    setSystems,
    initialEntities,
    setInitialEntities,
    expectedEntities,
    setExpectedEntities,
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

  useEffect(() => {
    // Don't run until modules have finished loading
    if (loadingModules) { 
      return;
    }

    // If not persisted, initialize selectedModules with all modules
    if(persistedState?.selectedModules === undefined) {
      console.log("Setting selectedModules to all available")
      setSelectedModules(availableModules.map(m => m.fullPath));
    } else {
      console.log("*** useEffect, availableModules: ", availableModules);
      // Filter out selected that are not in available 
      const availableModuleSet = new Set(availableModules.map(m => m.fullPath));
      const filteredSelected = selectedModules.filter(m => availableModuleSet.has(m));
      console.log("*** useEffect, filteredSelected: ", filteredSelected);
      if (filteredSelected.length !== selectedModules.length) {
        setSelectedModules(filteredSelected);
      }
    }
  }, [availableModules, loadingModules, setSelectedModules]); 

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
  }, [availableSystems, loadingModules, loadingMetadata, setSystems]);

  // Clear components from entities that are no longer available in selected modules
  useEffect(() => {
    if (loadingModules || loadingMetadata) { 
      return;
    }

    const availableComponentNames = new Set(availableComponents.map(c => c.name));
    const filterEntities = (entities: Core.EntityData[]) => {
      return entities.map(entity => ({
        ...entity,
        components: entity.components.filter(comp => availableComponentNames.has(comp.name))
      }));
    };

    const filteredInitial = filterEntities(initialEntities);
    const filteredExpected = filterEntities(expectedEntities);
    
    if (JSON.stringify(filteredInitial) !== JSON.stringify(initialEntities)) {
      setInitialEntities(filteredInitial);
    }
    if (JSON.stringify(filteredExpected) !== JSON.stringify(expectedEntities)) {
      setExpectedEntities(filteredExpected);
    }
  }, [availableComponents, loadingModules, loadingMetadata, setInitialEntities, setExpectedEntities]);

  // System management
  const addSystem = () => {
    setSystems([...systems, { name: "", timesToRun: 1 }]);
  };

  const updateSystem = (index: number, field: keyof Core.SystemInvocation, value: string | number) => {
    const newSystems = [...systems];
    newSystems[index] = { ...newSystems[index], [field]: value };
    setSystems(newSystems);
  };

  const removeSystem = (index: number) => {
    setSystems(systems.filter((_, i) => i !== index));
  };

  // Entity management
  const addEntity = (isInitial: boolean) => {
    const newEntity: Core.EntityData = { entity: "", components: [] };
    if (isInitial) {
      setInitialEntities([...initialEntities, newEntity]);
    } else {
      setExpectedEntities([...expectedEntities, newEntity]);
    }
  };

  const updateEntityName = (index: number, name: string, isInitial: boolean) => {
    if (isInitial) {
      const newEntities = [...initialEntities];
      newEntities[index] = { ...newEntities[index], entity: name };
      setInitialEntities(newEntities);
    } else {
      const newEntities = [...expectedEntities];
      newEntities[index] = { ...newEntities[index], entity: name };
      setExpectedEntities(newEntities);
    }
  };

  const removeEntity = (index: number, isInitial: boolean) => {
    if (isInitial) {
      setInitialEntities(initialEntities.filter((_, i) => i !== index));
    } else {
      setExpectedEntities(expectedEntities.filter((_, i) => i !== index));
    }
  };

  // Component management
  const addComponent = (entityIndex: number, isInitial: boolean) => {
    const newComponent: Core.ComponentData = { name: "", module: "" };
    if (isInitial) {
      const newEntities = [...initialEntities];
      newEntities[entityIndex].components.push(newComponent);
      setInitialEntities(newEntities);
    } else {
      const newEntities = [...expectedEntities];
      newEntities[entityIndex].components.push(newComponent);
      setExpectedEntities(newEntities);
    }
  };

  const createUpdatedComponentData = (
    entityIndex: number,
    componentIndex: number,
    field: string,
    value: any,
    entities: Core.EntityData[]
  ): Core.EntityData[] => {
    const newEntities = [...entities];
    
    if (field === 'name') {
      // When component name changes, reset fields to defaults
      const component = availableComponents.find(c => c.name === value);
      const newComponentData: Core.ComponentData = { 
        name: value,
        module: component?.module || ""
      };
      
      // Initialize with default values for component fields
      if (component) {
        component.fields.forEach(field => {
          newComponentData[field.name] = FlecsMetadataService.getDefaultValueForType(field.type);
        });
      }
      
      newEntities[entityIndex].components[componentIndex] = newComponentData;
    } else {
      newEntities[entityIndex].components[componentIndex][field] = value;
    }
    
    return newEntities;
  };

  const updateComponent = (
    entityIndex: number, 
    componentIndex: number, 
    field: string, 
    value: any, 
    isInitial: boolean // TODO: instead of boolean, store all entities in single state object
  ) => {
    if (isInitial) {
      const updatedEntities = createUpdatedComponentData(
        entityIndex, componentIndex, field, value, initialEntities
      );
      setInitialEntities(updatedEntities);
    } else {
      const updatedEntities = createUpdatedComponentData(
        entityIndex, componentIndex, field, value, expectedEntities
      );
      setExpectedEntities(updatedEntities);
    }
  };

  const removeComponent = (entityIndex: number, componentIndex: number, isInitial: boolean) => {
    if (isInitial) {
      const newEntities = [...initialEntities];
      newEntities[entityIndex].components = 
        newEntities[entityIndex].components.filter((_: any, i: number) => i !== componentIndex);
      setInitialEntities(newEntities);
    } else {
      const newEntities = [...expectedEntities];
      newEntities[entityIndex].components = 
      newEntities[entityIndex].components.filter((_: any, i: number) => i !== componentIndex);
      setExpectedEntities(newEntities);
    }
  };

  // Generate UnitTest from form data
  const generateTest = (validate: boolean = true) => {
    if (validate && !testName.trim()) {
      showToast("Test name is required", 'error');
      return null;
    }

    if(validate) { 
      if (systems.length === 0) {
        showToast("At least one system is required", 'error');
        return null;
      }

      if (systems.some(s => !s.name.trim())) {
        showToast("All systems must have names", 'error');
        return null;
      }
    }

    return TestRunner.createTest(
      testName.trim(),
      systems.map(s => ({
        name: s.name.trim(),
        timesToRun: s.timesToRun
      })),
      initialEntities,
      expectedEntities
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
  }, [testName, systems, initialEntities, expectedEntities, setJsonPreview]);

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
    if (!testName.trim()) {
      showToast("Test name is required", 'error');
      return;
    }

    if (systems.length === 0) {
      showToast("At least one system is required", 'error');
      return;
    }

    if (systems.some(s => !s.name.trim())) {
      showToast("All systems must have names", 'error');
      return;
    }

    if (initialEntities.length === 0) {
      showToast("Initial entities are required to generate expected state", 'error');
      return;
    }

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
        initialEntities
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
          setExpectedEntities(parsedEntities);
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
    setInitialEntities([]);
    setExpectedEntities([]);
    setJsonPreview("");
  };

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
            modules={availableModules}
            selectedModules={selectedModules}
            onSelectionChange={setSelectedModules}
            loading={false}
          />

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
          ) : (<>
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
                    systems={systems}
                    availableSystems={availableSystems}
                    onUpdate={updateSystem}
                    onRemove={removeSystem}
                    onAdd={addSystem} />
                )}
              </CardContent>
            </Card>

            <div className={stackedStateLayout ? "space-y-8" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
              <Card>
                <CardHeader>
                  <CardTitle>Initial State (Entities & Components)</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedModules.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground italic">
                      Please select at least one module to see available components
                    </div>
                  ) : (
                    <EntityBuilderComponent
                      entities={initialEntities}
                      availableComponents={availableComponents}
                      onUpdateEntityName={(index, name) => updateEntityName(index, name, true)}
                      onRemoveEntity={(index) => removeEntity(index, true)}
                      onAddEntity={() => addEntity(true)}
                      onAddComponent={(entityIndex) => addComponent(entityIndex, true)}
                      onUpdateComponent={(entityIndex, componentIndex, field, value) => updateComponent(entityIndex, componentIndex, field, value, true)}
                      onRemoveComponent={(entityIndex, componentIndex) => removeComponent(entityIndex, componentIndex, true)}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expected State (Entities & Components)</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedModules.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground italic">
                      Please select at least one module to see available components
                    </div>
                  ) : (
                    <EntityBuilderComponent
                      entities={expectedEntities}
                      availableComponents={availableComponents}
                      onUpdateEntityName={(index, name) => updateEntityName(index, name, false)}
                      onRemoveEntity={(index) => removeEntity(index, false)}
                      onAddEntity={() => addEntity(false)}
                      onAddComponent={(entityIndex) => addComponent(entityIndex, false)}
                      onUpdateComponent={(entityIndex, componentIndex, field, value) => updateComponent(entityIndex, componentIndex, field, value, false)}
                      onRemoveComponent={(entityIndex, componentIndex) => removeComponent(entityIndex, componentIndex, false)}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </>)}
          
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
              disabled={isGeneratingExpected || !testName.trim() || systems.length === 0 || initialEntities.length === 0}
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
        </div>

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
      </div>
    </div>
  );
}
