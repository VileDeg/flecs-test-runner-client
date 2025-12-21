import React from "react";
import { FlecsMetadataService, type FlecsMetadata } from "@common/flecsMetadataService.ts";
import { FormGroup, Label, Input } from "./styles.ts";

import type { FlecsCore } from "@common/testRunner.ts";

export interface ComponentFieldsProps {
  component: FlecsCore.ComponentData;
  componentSchema: FlecsMetadata.Component;
  entityIndex: number;
  componentIndex: number;
  onUpdate: (entityIndex: number, componentIndex: number, field: string, value: any) => void;
}

export const ComponentFields: React.FC<ComponentFieldsProps> = ({
  component,
  componentSchema,
  entityIndex,
  componentIndex,
  onUpdate,
}) => {
  if (!componentSchema || componentSchema.fields.length === 0) {
    return <div style={{ fontStyle: 'italic', color: '#666' }}>No fields available for this component</div>;
  }

  return (
    <>
      {componentSchema.fields.map(field => (
        <FormGroup key={field.name} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Label style={{ flex: '0 0 100px' }}>{field.name}:</Label>
          <Input
            type={field.type === 'bool' || field.type === 'boolean' ? 'checkbox' : 'text'}
            value={String(component[field.name] ?? FlecsMetadataService.getDefaultValueForType(field.type))}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = field.type === 'bool' || field.type === 'boolean' 
                ? e.target.checked 
                : FlecsMetadataService.formatValueForType(e.target.value, field.type);
              onUpdate(entityIndex, componentIndex, field.name, value);
            }}
            placeholder={`${field.type} field`}
            style={{ flex: 1 }}
          />
        </FormGroup>
      ))}
    </>
  );
};
