import React from "react";
import { ComponentFields } from "./componentFields.tsx";
import { type FlecsMetadata } from "@common/flecsMetadataService.ts";
import type * as Core from "@common/coreTypes.ts";
import {
  EntityBuilder as EntityBuilderStyled,
  EntityItem,
  FormGroup,
  Label,
  Input,
  Select,
  RemoveButton,
  AddButton,
  ButtonContainer,
  ComponentBuilder,
  ComponentItem,
} from "./styles.ts";


export interface EntityBuilderProps {
  entities: Core.EntityData[];
  availableComponents: FlecsMetadata.Component[];
  isInitial: boolean;
  onUpdateEntityName: (index: number, name: string) => void;
  onRemoveEntity: (index: number) => void;
  onAddEntity: () => void;
  onUpdateComponent: (entityIndex: number, componentIndex: number, field: string, value: any) => void;
  onRemoveComponent: (entityIndex: number, componentIndex: number) => void;
  onAddComponent: (entityIndex: number) => void;
}

export const EntityBuilderComponent: React.FC<EntityBuilderProps> = ({
  entities,
  availableComponents,
  isInitial,
  onUpdateEntityName,
  onRemoveEntity,
  onAddEntity,
  onUpdateComponent,
  onRemoveComponent,
  onAddComponent,
}) => {
  return (
    <>
      <EntityBuilderStyled>
        {entities.map((entity, entityIndex) => (
          <EntityItem key={entityIndex}>
            <FormGroup>
              <Label>Entity Name</Label>
              <Input
                type="text"
                value={entity.entity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  onUpdateEntityName(entityIndex, e.target.value)
                }
                placeholder="e.g., TestEntity"
              />
            </FormGroup>
            
            <ComponentBuilder>
              {entity.components.map((component, componentIndex) => {
                const componentSchema = availableComponents.find(c => c.name === component.name);
                
                return (
                  <ComponentItem key={componentIndex}>
                    <FormGroup>
                      <Label>Component</Label>
                      <Select
                        value={component.name}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                          onUpdateComponent(entityIndex, componentIndex, 'name', e.target.value)
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
                    
                    {component.name && componentSchema && (
                      <div>
                        <Label>Component Fields</Label>
                        <ComponentFields
                          component={component}
                          componentSchema={componentSchema}
                          entityIndex={entityIndex}
                          componentIndex={componentIndex}
                          onUpdate={onUpdateComponent}
                        />
                      </div>
                    )}
                    
                    <RemoveButton onClick={() => onRemoveComponent(entityIndex, componentIndex)}>
                      Remove Component
                    </RemoveButton>
                  </ComponentItem>
                );
              })}
              <AddButton onClick={() => onAddComponent(entityIndex)}>Add Component</AddButton>
            </ComponentBuilder>
            
            <ButtonContainer>
              <RemoveButton onClick={() => onRemoveEntity(entityIndex)}>Remove Entity</RemoveButton>
            </ButtonContainer>
          </EntityItem>
        ))}
      </EntityBuilderStyled>
      <ButtonContainer>
        <AddButton onClick={onAddEntity}>Add Entity</AddButton>
      </ButtonContainer>
    </>
  );
};
