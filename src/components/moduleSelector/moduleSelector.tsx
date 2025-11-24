import React from "react";
import type { FlecsModule } from "../../common/flecsMetadataService";
import {
  Container,
  Header,
  ModuleList,
  ModuleItem,
  Checkbox,
  Label,
  ButtonGroup,
  Button,
  InfoText
} from "./styles.ts";

interface ModuleSelectorProps {
  modules: FlecsModule[];
  selectedModules: string[];
  onSelectionChange: (selectedModules: string[]) => void;
  loading?: boolean;
}

export const ModuleSelector: React.FC<ModuleSelectorProps> = ({
  modules,
  selectedModules,
  onSelectionChange,
  loading = false
}) => {
  const handleToggleModule = (moduleFullPath: string) => {
    if (selectedModules.includes(moduleFullPath)) {
      onSelectionChange(selectedModules.filter(m => m !== moduleFullPath));
    } else {
      onSelectionChange([...selectedModules, moduleFullPath]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(modules.map(m => m.fullPath));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  if (loading) {
    return (
      <Container>
        <Header>Module Selection</Header>
        <InfoText>Loading modules...</InfoText>
      </Container>
    );
  }

  if (modules.length === 0) {
    return (
      <Container>
        <Header>Module Selection</Header>
        <InfoText>No modules found</InfoText>
      </Container>
    );
  }

  return (
    <Container>
      <Header>Module Selection</Header>
      <InfoText>
        Select the modules to filter systems and components. 
        Selected: {selectedModules.length} / {modules.length}
      </InfoText>
      
      <ButtonGroup>
        <Button onClick={handleSelectAll}>Select All</Button>
        <Button onClick={handleDeselectAll}>Deselect All</Button>
      </ButtonGroup>

      <ModuleList>
        {modules.map((module) => (
          <ModuleItem key={module.fullPath}>
            <Checkbox
              type="checkbox"
              id={`module-${module.fullPath}`}
              checked={selectedModules.includes(module.fullPath)}
              onChange={() => handleToggleModule(module.fullPath)}
            />
            <Label htmlFor={`module-${module.fullPath}`}>
              <strong>{module.name}</strong>
              {module.fullPath !== module.name && (
                <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '8px' }}>
                  ({module.fullPath})
                </span>
              )}
            </Label>
          </ModuleItem>
        ))}
      </ModuleList>
    </Container>
  );
};
