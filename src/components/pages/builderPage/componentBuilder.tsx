import React, { useState } from "react";
import { Button } from "@components/ui/button";
import { Label } from "@components/ui/label";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";

import type { 
  Component,
  ComponentField,
  EntityHeader,
  SupportedOperators,
} from "@/common/types";

// import { 
//   getComponentFullName,
// } from "@/common/types";



import { OperatorType } from "@/common/coreTypes";

import { ComponentFieldBuilder } from "@/components/pages/builderPage/componentFieldBuilder"
import { OperatorControls } from "@pages/builderPage/operatorControls.tsx"

import { DEFAULT_COMPONENT, OPERATOR_PATH_SEP } from "@/common/constants";
import { useBuilder } from "@/contexts/builderContext";
import { ComponentSelector } from "@/components/ui/component-selector";
//import { makePath } from "@/common/utils";
import { useMetadataLoader } from "@/contexts/metadataLoaderContext";

export interface ComponentBuilderProps {
  isExpected: boolean
  entityHeader: EntityHeader
  index: number;
  component: Component;
  //availableComponents: Components;
  // Null signalizes to remove from 
  onUpdate: (updates: Partial<Component> | null) => void;
  // Operator management
  //onOperatorChanged?: (type: OperatorType | null, fullPath: string) => void;
}

export const ComponentBuilder: React.FC<ComponentBuilderProps> = ({
  isExpected,
  entityHeader,
  index,
  component,
  // availableComponents,
  onUpdate,
  //onOperatorChanged,
}) => {

  const [isExpanded, setIsExpanded] = useState(true);

  const {
    availableComponents,
    replaceComponent,
    isOperatorEnabled,
    onOperatorChanged,
    getOperatorType,
    getEntity
  } = useBuilder();
  
  // const isEntityHaveComponent = (name: string, entityId: string): boolean => {
  //   return getEntity(entityId, isExpected)!.components.some(comp => comp.name === name)
  // } 
  
  // const getAvailableComponents = () => {
  //   return availableComponents.filter(comp => !isEntityHaveComponent(comp.name, entityHeader.id))
  // }


  const getComponentFullPath = () => (
    [entityHeader.id, component.id].join(OPERATOR_PATH_SEP)
  )

  const myFullPath = getComponentFullPath();
  //const operatorEnabled = isOperatorEnabled(myFullPath)

  // const getAvailableComponent = (name: string): Component => {
  //   const component = 
  //       availableComponents.find((component) => component.name == name);
  //   if(!component) {
  //     throw Error(`Component with name ${name} was not found`);
  //   }
  //   return component;
  // }

  const updateField = (
    fieldName: string,
    field: ComponentField,
  ) => {
    const newFields = component.fields;
    newFields[fieldName] = field;
    onUpdate({...component, fields: newFields});
  };

  // const replaceComponent = (
  //   componentName: string, 
  // ) => {
  //   const newComponent = getAvailableComponent(componentName);
  //   onUpdate(newComponent);
  // };

  // const removeComponent = () => {
  //   onUpdate(null);
  // };

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
      //operatorDisabled={!operatorEnabled}
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
      {/* <Label htmlFor={`component-${TODO}`}>Component</Label> */}
      {/* <div className="grid grid-cols-[3fr_1fr]">
        <div className="justify-self-start p-4">
          {renderComponentSelector()}
        </div>
      </div> */}
      {renderComponentSelector()}
      <div className="grow"/>
      {renderOperatorControls()}
      {!isExpected && renderRemoveButton()}
    </div>
  )
  
  const renderFields = () => (
    <div className="space-y-2">
      {/* <Label>Component Fields</Label> */}
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
      // key={componentIndex} 
      className="p-2 border border-border rounded-md bg-background space-y-3 overflow-x-auto" 
    >
     
      {renderHeader()} 
     
      {isExpanded && renderFields()}
      
    </div>
  );
};