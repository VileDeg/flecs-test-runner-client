import React from "react";
import type { FlecsMetadata } from "../../common/flecsMetadataService";
import {
  ModuleSelectorContainer,
  ModuleSelectorHeader,
  ModuleList,
  ModuleItem,
  ModuleCheckbox,
  ModuleLabel,
  ModuleButtonGroup,
  Button,
  ModuleInfoText
} from "./styles.ts";

interface ModuleSelectorProps {
  modules: FlecsMetadata.Module[];
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
      <ModuleSelectorContainer>
        <ModuleSelectorHeader>Module Selection</ModuleSelectorHeader>
        <ModuleInfoText>Loading modules...</ModuleInfoText>
      </ModuleSelectorContainer>
    );
  }

  if (modules.length === 0) {
    return (
      <ModuleSelectorContainer>
        <ModuleSelectorHeader>Module Selection</ModuleSelectorHeader>
        <ModuleInfoText>No modules found</ModuleInfoText>
      </ModuleSelectorContainer>
    );
  }

  return (
    <ModuleSelectorContainer>
      <ModuleSelectorHeader>Module Selection</ModuleSelectorHeader>
      <ModuleInfoText>
        Select the modules to filter systems and components. 
        Selected: {selectedModules.length} / {modules.length}
      </ModuleInfoText>
      
      <ModuleButtonGroup>
        <Button onClick={handleSelectAll}>Select All</Button>
        <Button onClick={handleDeselectAll}>Deselect All</Button>
      </ModuleButtonGroup>

      <ModuleList>
        {modules.map((module) => (
          <ModuleItem key={module.fullPath}>
            <ModuleCheckbox
              type="checkbox"
              id={`module-${module.fullPath}`}
              checked={selectedModules.includes(module.fullPath)}
              onChange={() => handleToggleModule(module.fullPath)}
            />
            <ModuleLabel htmlFor={`module-${module.fullPath}`}>
              <strong>{module.name}</strong>
              {module.fullPath !== module.name && (
                <span style={{ color: '#666', fontSize: '0.9em', marginLeft: '8px' }}>
                  ({module.fullPath})
                </span>
              )}
            </ModuleLabel>
          </ModuleItem>
        ))}
      </ModuleList>
    </ModuleSelectorContainer>
  );
};
