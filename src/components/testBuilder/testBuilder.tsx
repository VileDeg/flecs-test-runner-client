import React, { useState, useEffect } from "react";
import { useFlecsConnection } from "../../context/flecsConnection/useFlecsConnection.ts";
import { FlecsMetadataService, type FlecsSystem, type FlecsComponent, type FlecsModule } from "../../common/flecsMetadataService.ts";
import { TestRunner, type SystemInvocation, type EntityData, type ComponentData } from "../../common/testRunner.ts";
import { ModuleSelector } from "../moduleSelector/moduleSelector.tsx";
import {
  Container,
  Header,
  Section,
  SectionHeader,
  FormGroup,
  Label,
  Input,
  Button,
  SystemItem,
  SystemList,
  RemoveButton,
  AddButton,
  EntityBuilder,
  ComponentBuilder,
  ComponentItem,
  EntityItem,
  PreviewBox,
  ActionButtons,
  SaveJsonButton,
  RunTestButton,
  Select,
  ToastContainer,
  Toast,
  ToastIcon,
  ToastMessage,
  ToastCloseButton,
} from "./styles.ts";

export interface TestBuilderPersistedState {
  testName: string;
  systems: SystemInvocation[];
  initialEntities: EntityData[];
  expectedEntities: EntityData[];
  selectedModules: string[];
}

interface TestBuilderProps {
  onTestCreated?: () => void;
  persistedState?: TestBuilderPersistedState;
  onStateChange?: (state: TestBuilderPersistedState) => void;
}

export const TestBuilder: React.FC<TestBuilderProps> = ({ 
  onTestCreated, 
  persistedState,
  onStateChange 
}) => {
  const [testName, setTestName] = useState(persistedState?.testName || "");
  const [systems, setSystems] = useState<SystemInvocation[]>(persistedState?.systems || []);
  const [initialEntities, setInitialEntities] = useState<EntityData[]>(persistedState?.initialEntities || []);
  const [expectedEntities, setExpectedEntities] = useState<EntityData[]>(persistedState?.expectedEntities || []);
  const [jsonPreview, setJsonPreview] = useState("");
  
  // Toast notification state
  interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error';
  }
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // State for incomplete test execution (expected state generation)
  const [isGeneratingExpected, setIsGeneratingExpected] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState("");
  
  // Module selection
  const [availableModules, setAvailableModules] = useState<FlecsModule[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>(persistedState?.selectedModules || []);
  //const [usedModules, setUsedModules] = useState<string[]>([]);
  
  // Available systems and components from Flecs (filtered by selected modules)
  const [availableSystems, setAvailableSystems] = useState<FlecsSystem[]>([]);
  const [availableComponents, setAvailableComponents] = useState<FlecsComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  const { connection } = useFlecsConnection();

  // Toast notification functions
  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };
  
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Persist state changes to parent component
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        testName,
        systems,
        initialEntities,
        expectedEntities,
        selectedModules
      });
    }
  }, [testName, systems, initialEntities, expectedEntities, selectedModules, onStateChange]);

  // Load available modules on mount
  useEffect(() => {
    const loadModules = async () => {
      if (!connection) return;
      
      setLoading(true);
      try {
        const modulesData = await FlecsMetadataService.getModules(connection);
        setAvailableModules(modulesData);
        // Only set default selection if no persisted selection exists
        if (!persistedState?.selectedModules || persistedState.selectedModules.length === 0) {
          setSelectedModules(modulesData.map(m => m.fullPath));
        }
      } catch (error: any) {
        showToast(`Failed to load modules: ${error.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, [connection, persistedState?.selectedModules]);

  // Load systems and components when selected modules change
  useEffect(() => {
    const loadFlecsMetadata = async () => {
      if (!connection || selectedModules.length === 0) {
        setAvailableSystems([]);
        setAvailableComponents([]);
        return;
      }
      
      setLoadingMetadata(true);
      try {
        const [systemsData, componentsData] = await Promise.all([
          FlecsMetadataService.getSystems(connection, selectedModules),
          FlecsMetadataService.getComponents(connection, selectedModules)
        ]);
        
        setAvailableSystems(systemsData);
        setAvailableComponents(componentsData);
      } catch (error: any) {
        showToast(`Failed to load Flecs metadata: ${error.message}`, 'error');
      } finally {
        setLoadingMetadata(false);
      }
    };

    loadFlecsMetadata();
  }, [connection, selectedModules]);

  // System management
  const addSystem = () => {
    setSystems([...systems, { name: "", timesToRun: 1 }]);
  };

  const updateSystem = (index: number, field: keyof SystemInvocation, value: string | number) => {
    const newSystems = [...systems];
    newSystems[index] = { ...newSystems[index], [field]: value };
    setSystems(newSystems);
  };

  const removeSystem = (index: number) => {
    setSystems(systems.filter((_, i) => i !== index));
  };

  // Entity management
  const addEntity = (isInitial: boolean) => {
    const newEntity: EntityData = { entity: "", components: [] };
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
    const newComponent: ComponentData = { name: "", module: "" };
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
    entities: EntityData[]
  ): EntityData[] => {
    const newEntities = [...entities];
    
    if (field === 'name') {
      // When component name changes, reset fields to defaults
      const component = availableComponents.find(c => c.name === value);
      const newComponentData: ComponentData = { 
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
    isInitial: boolean
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
      newEntities[entityIndex].components = newEntities[entityIndex].components.filter((_, i) => i !== componentIndex);
      setInitialEntities(newEntities);
    } else {
      const newEntities = [...expectedEntities];
      newEntities[entityIndex].components = newEntities[entityIndex].components.filter((_, i) => i !== componentIndex);
      setExpectedEntities(newEntities);
    }
  };

  // Generate UnitTest from form data
  const generateTest = () => {
    if (!testName.trim()) {
      showToast("Test name is required", 'error');
      return null;
    }

    if (systems.length === 0) {
      showToast("At least one system is required", 'error');
      return null;
    }

    if (systems.some(s => !s.name.trim())) {
      showToast("All systems must have names", 'error');
      return null;
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
    const test = generateTest();
    if (test) {
      setJsonPreview(JSON.stringify(test, null, 2));
    } else {
      setJsonPreview("");
    }
  }, [testName, systems, initialEntities, expectedEntities]);

  const downloadJson = () => {
    const test = generateTest();
    if (test) {
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
    }
  };

  const runTest = async () => {
    const test = generateTest();
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

  if (loading) {
    return (
      <Container>
        <Header>Test Builder</Header>
        <div>Loading modules...</div>
      </Container>
    );
  }

  const renderComponentFields = (
    component: ComponentData, 
    entityIndex: number, 
    componentIndex: number, 
    isInitial: boolean
  ) => {
    const componentSchema = availableComponents.find(c => c.name === component.name);
    if (!componentSchema || componentSchema.fields.length === 0) {
      return <div style={{ fontStyle: 'italic', color: '#666' }}>No fields available for this component</div>;
    }

    return componentSchema.fields.map(field => (
      <FormGroup key={field.name} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Label style={{ flex: '0 0 100px' }}>{field.name}:</Label>
        <Input
          type={field.type === 'bool' || field.type === 'boolean' ? 'checkbox' : 'text'}
          value={String(component[field.name] ?? FlecsMetadataService.getDefaultValueForType(field.type))}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = field.type === 'bool' || field.type === 'boolean' 
              ? e.target.checked 
              : FlecsMetadataService.formatValueForType(e.target.value, field.type);
            updateComponent(entityIndex, componentIndex, field.name, value, isInitial);
          }}
          placeholder={`${field.type} field`}
          style={{ flex: 1 }}
        />
      </FormGroup>
    ));
  };

  const renderSystemsList = () => {
    return (
      <>
        <SystemList>
          {systems.map((system, index) => (
            <SystemItem key={index}>
              <FormGroup>
                <Label>System Name</Label>
                <Select
                  value={system.name}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                    updateSystem(index, 'name', e.target.value)
                  }
                >
                  <option value="">Select a system...</option>
                  {availableSystems.map(sys => (
                    <option key={sys.name} value={sys.module + "." + sys.name}>
                      {sys.name} {sys.module && `(${sys.module})`}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Times to Run</Label>
                <Input
                  type="number"
                  value={system.timesToRun}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    updateSystem(index, 'timesToRun', parseInt(e.target.value) || 1)
                  }
                  min="1"
                />
              </FormGroup>
              <RemoveButton onClick={() => removeSystem(index)}>Remove</RemoveButton>
            </SystemItem>
          ))}
        </SystemList>
        <AddButton onClick={addSystem}>Add System</AddButton>
      </>
    );
  };

  const renderEntityBuilder = (
    entities: EntityData[],
    isInitial: boolean
  ) => {
    return (
      <>
        <EntityBuilder>
          {entities.map((entity, entityIndex) => (
            <EntityItem key={entityIndex}>
              <FormGroup>
                <Label>Entity Name</Label>
                <Input
                  type="text"
                  value={entity.entity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    updateEntityName(entityIndex, e.target.value, isInitial)
                  }
                  placeholder="e.g., TestEntity"
                />
              </FormGroup>
              
              <ComponentBuilder>
                {entity.components.map((component, componentIndex) => (
                  <ComponentItem key={componentIndex}>
                    <FormGroup>
                      <Label>Component</Label>
                      <Select
                        value={component.name}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                          updateComponent(entityIndex, componentIndex, 'name', e.target.value, isInitial)
                        }
                        disabled={availableComponents.length === 0}
                      >
                        <option value="">
                          {availableComponents.length === 0 
                            ? 'No components available in selected modules' 
                            : 'Select a component...'}
                        </option>
                        {availableComponents.map(comp => (
                          <option key={comp.name} value={comp.name}>
                            {comp.name} {comp.module && `(${comp.module})`}
                          </option>
                        ))}
                      </Select>
                    </FormGroup>
                    
                    {component.name && (
                      <div>
                        <Label>Component Fields</Label>
                        {renderComponentFields(component, entityIndex, componentIndex, isInitial)}
                      </div>
                    )}
                    
                    <RemoveButton onClick={() => removeComponent(entityIndex, componentIndex, isInitial)}>
                      Remove Component
                    </RemoveButton>
                  </ComponentItem>
                ))}
                <AddButton onClick={() => addComponent(entityIndex, isInitial)}>Add Component</AddButton>
              </ComponentBuilder>
              
              <RemoveButton onClick={() => removeEntity(entityIndex, isInitial)}>Remove Entity</RemoveButton>
            </EntityItem>
          ))}
        </EntityBuilder>
        <AddButton onClick={() => addEntity(isInitial)}>Add Entity</AddButton>
      </>
    );
  };

  return (
    <Container>
      <Header>Test Builder</Header>

      <ModuleSelector
        modules={availableModules}
        selectedModules={selectedModules}
        onSelectionChange={setSelectedModules}
        loading={false}
      />

      {loadingMetadata && (
        <Section>
          <div style={{ textAlign: 'center', color: '#666' }}>
            Loading systems and components...
          </div>
        </Section>
      )}

      <Section>
        <SectionHeader>Test Configuration</SectionHeader>
        <FormGroup>
          <Label>Test Name</Label>
          <Input
            type="text"
            value={testName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTestName(e.target.value)}
            placeholder="Enter test name"
          />
        </FormGroup>
      </Section>

      <Section>
        <SectionHeader>Systems to Run</SectionHeader>
        {selectedModules.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
            Please select at least one module to see available systems
          </div>
        ) : availableSystems.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
            No systems found in selected modules
          </div>
        ) : (
          renderSystemsList()
        )}
      </Section>

      <Section>
        <SectionHeader>Initial State (Entities & Components)</SectionHeader>
        {selectedModules.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
            Please select at least one module to see available components
          </div>
        ) : (
          renderEntityBuilder(initialEntities, true)
        )}
      </Section>

      <Section>
        <SectionHeader>Expected State (After System Execution)</SectionHeader>
        {isGeneratingExpected && (
          <div style={{ 
            padding: '12px', 
            marginBottom: '16px', 
            backgroundColor: '#e3f2fd', 
            color: '#1976d2', 
            borderRadius: '4px',
            textAlign: 'center'
          }}>
            {generatingMessage}
          </div>
        )}
        {!isGeneratingExpected && initialEntities.length > 0 && systems.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Button 
              onClick={fillExpectedFromInitial}
              disabled={isGeneratingExpected}
              style={{ width: '100%' }}
            >
              Fill Expected State from Initial (Run Test)
            </Button>
          </div>
        )}
        {selectedModules.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
            Please select at least one module to see available components
          </div>
        ) : (
          renderEntityBuilder(expectedEntities, false)
        )}
      </Section>

      <ActionButtons>
        <SaveJsonButton onClick={downloadJson}>Save Test File</SaveJsonButton>
        <RunTestButton onClick={runTest}>Run Test</RunTestButton>
        <Button onClick={clearForm}>Clear Form</Button>
      </ActionButtons>

      {jsonPreview && (
        <Section>
          <SectionHeader>JSON Preview</SectionHeader>
          <PreviewBox>
            <pre>{jsonPreview}</pre>
          </PreviewBox>
        </Section>
      )}

      <ToastContainer>
        {toasts.map(toast => (
          <Toast key={toast.id} type={toast.type}>
            <ToastIcon>{toast.type === 'success' ? '✓' : '✕'}</ToastIcon>
            <ToastMessage>{toast.message}</ToastMessage>
            <ToastCloseButton onClick={() => removeToast(toast.id)}>×</ToastCloseButton>
          </Toast>
        ))}
      </ToastContainer>
    </Container>
  );
};