import React from "react";
import type { SystemsListProps } from "./builderPage.types.ts";
import {
  SystemList,
  SystemItem,
  FormGroup,
  Label,
  Select,
  Input,
  RemoveButton,
  AddButton,
} from "./styles.ts";

export const SystemsList: React.FC<SystemsListProps> = ({
  systems,
  availableSystems,
  onUpdate,
  onRemove,
  onAdd,
}) => {
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
                  onUpdate(index, 'name', e.target.value)
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
                  onUpdate(index, 'timesToRun', parseInt(e.target.value) || 1)
                }
                min="1"
              />
            </FormGroup>
            <RemoveButton onClick={() => onRemove(index)}>Remove</RemoveButton>
          </SystemItem>
        ))}
      </SystemList>
      <AddButton onClick={onAdd}>Add System</AddButton>
    </>
  );
};
