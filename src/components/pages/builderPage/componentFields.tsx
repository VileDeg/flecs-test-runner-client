import React from "react";
import { FlecsMetadataService, type FlecsMetadata } from "@common/flecsMetadataService.ts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

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
    return (
      <div className="text-center py-4 text-muted-foreground italic">
        No fields available for this component
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {componentSchema.fields.map(field => {
        const isBoolean = field.type === 'bool' || field.type === 'boolean';
        const fieldValue = component[field.name] ?? FlecsMetadataService.getDefaultValueForType(field.type);
        
        return (
          <div key={field.name} className="flex items-center gap-3">
            <Label htmlFor={`field-${field.name}`} className="w-32 text-sm font-medium">
              {field.name}:
            </Label>
            
            {isBoolean ? (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`field-${field.name}`}
                  checked={Boolean(fieldValue)}
                  onCheckedChange={(checked) => {
                    onUpdate(field.name, checked);
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {field.type}
                </span>
              </div>
            ) : (
              <Input
                id={`field-${field.name}`}
                type="text"
                value={String(fieldValue)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = FlecsMetadataService.formatValueForType(e.target.value, field.type);
                  onUpdate(field.name, value);
                }}
                placeholder={`${field.type} field`}
                className="flex-1"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};