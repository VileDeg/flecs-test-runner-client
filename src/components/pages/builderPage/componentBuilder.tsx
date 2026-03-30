import React, { useState } from "react";
import { Button } from "@components/ui/button";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";

import type { 
  Component,
  ComponentField,
  EntityHeader,
  SupportedOperators,
} from "@/common/types";

import { OperatorType } from "@/common/coreTypes";

import { ComponentFieldBuilder } from "@/components/pages/builderPage/componentFieldBuilder"
import { OperatorControls } from "@pages/builderPage/operatorControls.tsx"

import { OPERATOR_PATH_SEP } from "@/common/constants";
import { useBuilder } from "@/contexts/builderContext";
import { ComponentSelector } from "@/components/ui/component-selector";

export interface ComponentBuilderProps {
  isExpected: boolean
  entityHeader: EntityHeader
  index: number;
  component: Component;
  // Null signalizes to remove from 
  onUpdate: (updates: Partial<Component> | null) => void;
}

export const ComponentBuilder: React.FC<ComponentBuilderProps> = ({
  isExpected,
  entityHeader,
  index,
  component,
  onUpdate,
}) => {

  const [isExpanded, setIsExpanded] = useState(true);

  const {
    availableComponents,
    replaceComponent,
    onOperatorChanged,
    getOperatorType,
  } = useBuilder();
  
  const getComponentFullPath = () => (
    [entityHeader.id, component.id].join(OPERATOR_PATH_SEP)
  )

  const myFullPath = getComponentFullPath();

  const updateField = (
    fieldName: string,
    field: ComponentField,
  ) => {
    const newFields = component.fields;
    newFields[fieldName] = field;
    onUpdate({...component, fields: newFields});
  };

  const getSupportedOperatorTypes = (ops: SupportedOperators) => {
    return ops.cmp 
    ? Object.values(OperatorType)
    : ops.equals
      ? [OperatorType.Eq, OperatorType.Neq]
      : []
  }

  const makeChildFieldPath = (childFieldName: string) => {
    //console.log("Will reutrn", makePath([fullPath, childFieldName]))
    return [myFullPath, childFieldName].join(OPERATOR_PATH_SEP)
  }

  const renderOperatorControls = () => (
    isExpected && <OperatorControls
      operatorType={getOperatorType(myFullPath)}
      supportedOperators={getSupportedOperatorTypes(component.supportedOperators)}
      onOperatorTypeChange={(type) => onOperatorChanged(type, myFullPath)}
    >
    </OperatorControls>
  )

  const renderComponentSelector = () => (
    <div className="w-fit">
    <ComponentSelector
      id={`${component.id}`}
      value={component.id}
      onChange={(newComponentId) => replaceComponent(entityHeader.id, index, newComponentId)}
      availableComponents={availableComponents}
      disabled={isExpected}
    >
    </ComponentSelector>
    </div>
  )

  const renderHeader = () => (
    <div className="flex items-start mt-4 mb-4 mr-3">
      {renderCollapseToggle()}
      {renderComponentSelector()}
      <div className="grow"/>
      {renderOperatorControls()}
      {!isExpected && renderRemoveButton()}
    </div>
  )
  
  const renderFields = () => (
    <div className="space-y-2">
      {Object.entries(component.fields).map(([key, field]) => {
        return <ComponentFieldBuilder
          key={key}
          field={field}
          onUpdate={
            (field: ComponentField) => 
              updateField(key, field) 
          }
          isExpected={isExpected}
          fieldPath={makeChildFieldPath(key)}
        />
      })}
    </div>
  )

  const renderCollapseToggle = () => (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8" 
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </Button>
  )

  const renderRemoveButton = () => (
    <Button 
      variant="destructive" 
      size="sm"
      onClick={() => replaceComponent(entityHeader.id, index, null)}
      className="gap-2 w-auto"
    >
      <Trash2 className="h-4 w-4" />
      {/* Remove Component */}
    </Button>
  )

  return (
    <div 
      className="p-2 border border-border rounded-md bg-background space-y-3 overflow-x-auto" 
    >
      {renderHeader()} 
      {isExpanded && renderFields()}
    </div>
  );
};