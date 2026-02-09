import React from "react";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Checkbox } from "@components/ui/checkbox";
import { cn } from "@/lib/utils";


import type { 
  Component,
  PrimitiveType,
  System,
  QueryResponse,
  QueriedEntity,
  MetaComponentRegistry,
  ComponentField,
  ComponentFieldValue,
  ComponentFields,
  EntityConfiguration,
  WorldConfiguration,
  ComponentsRegistry,
} from "@/common/types";

import { 
  Module,
} from "@/common/types";

import * as Utils from "@common/utils.ts"

import { FlecsMetadataService } from "@common/flecsMetadataService.ts";

export interface ComponentFieldsProps {
  fields: ComponentFields;
  onUpdate: (fields: ComponentFields) => void;
}

export const ComponentFieldsBuilder: React.FC<ComponentFieldsProps> = ({
  fields,
  onUpdate,
}) => {

  const parseFieldValue = (value: string, type: string) => {
    try {
      value = 
        String(FlecsMetadataService.parseValueForPrimitiveType(type, value));
    } catch(err) {
      // TODO: assign error state and spawn a toast
    } finally {
      return value;
    }
  }

  

  if (Object.keys(fields).length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground italic">
        No fields available for this component
      </div>
    );
  }


  return (
    <div className="space-y-3">
      {Object.entries(fields).map(([name, field]) => {
        const isBoolean = FlecsMetadataService.isBooleanType(field.type);
        
        return (
          <div key={name} className="flex items-center gap-3">
            <Label htmlFor={`field-${name}`} className="w-32 text-sm font-medium">
              {name}:
            </Label>
            
            {isBoolean ? (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`field-${name}`}
                  checked={Boolean(field.value)}
                  onCheckedChange={(checked) => { // TODO: which type is checked here?
                    const newFields = {...fields};
                    newFields[name].value = checked ? "true" : "false";
                    onUpdate( newFields ); 
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {field.type}
                </span>
              </div>
            ) : (
              <Input
                id={`field-${name}`}
                type="text"
                value={String(field.value)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const newValue = parseFieldValue(field.type, e.target.value);
                    // = String(FlecsMetadataService.parseValueForPrimitiveType(
                    //   field.type, e.target.value
                    // ));
                  const newFields = {...fields};
                  newFields[name].value = newValue;
                  onUpdate( newFields ); 
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