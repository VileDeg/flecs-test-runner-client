import React from "react";
import { FlecsMetadataService, type FlecsMetadata } from "@common/flecsMetadataService.ts";
import { EmptyStateMessage, FieldRow, FieldLabel, FieldInput } from "./styles.ts";

import type * as Core from "@common/coreTypes.ts";

export interface ComponentFieldsProps {
  component: Core.ComponentData;
  componentSchema: FlecsMetadata.Component;
  onUpdate: (field: string, value: any) => void;
}

export const ComponentFields: React.FC<ComponentFieldsProps> = ({
  component,
  componentSchema,
  onUpdate,
}) => {
  if (!componentSchema || componentSchema.fields.length === 0) {
    return <EmptyStateMessage>No fields available for this component</EmptyStateMessage>;
  }

  return (
    <>
      {componentSchema.fields.map(field => (
        <FieldRow key={field.name}>
          <FieldLabel>{field.name}:</FieldLabel>
          <FieldInput
            type={field.type === 'bool' || field.type === 'boolean' ? 'checkbox' : 'text'}
            value={String(component[field.name] ?? FlecsMetadataService.getDefaultValueForType(field.type))}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = field.type === 'bool' || field.type === 'boolean' 
                ? e.target.checked 
                : FlecsMetadataService.formatValueForType(e.target.value, field.type);
              onUpdate(field.name, value);
            }}
            placeholder={`${field.type} field`}
          />
        </FieldRow>
      ))}
    </>
  );
};
