import React from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Package } from "lucide-react";


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

import { ComponentFieldsBuilder } from "@pages/builderPage/componentFields.tsx"

export interface WorldBuilderProps {
  worldConfiguration: WorldConfiguration;
  availableComponents: ComponentsRegistry;
  onUpdateWorldConfiguration: (worldConfiguration: WorldConfiguration) => void;
  // onRemoveEntity: (index: number) => void;
  // onAddEntity: () => void;
  // onUpdateComponent: (entityIndex: number, componentIndex: number, field: string, value: any) => void;
  // onRemoveComponent: (entityIndex: number, componentIndex: number) => void;
  // onAddComponent: (entityIndex: number) => void;
}

export const WorldBuilderComponent: React.FC<WorldBuilderProps> = ({
  worldConfiguration,
  availableComponents,
  onUpdateWorldConfiguration,
  // onUpdateEntityName,
  // onRemoveEntity,
  // onAddEntity,
  // onUpdateComponent,
  // onRemoveComponent,
  // onAddComponent,
}) => {
  // const updateConfig = (
  //   updater: (
  //     config: WorldConfiguration, 
  //   ) => void
  // ) => {
  //   // 1. Create a shallow copy of the main config object
  //   const newConfig = { ...worldConfiguration };

  //   // 3. Run the specific logic to modify the arrays
  //   updater(newConfig);

  //   // 5. Notify Parent
  //   onUpdateWorldConfiguration(newConfig);
  // };


  const addEntity = () => {
    const newEntity: EntityConfiguration = { entity: "", components: [] };
    worldConfiguration = [...worldConfiguration, newEntity];
    onUpdateWorldConfiguration(worldConfiguration);
  };

  const updateEntityName = (index: number, name: string) => {
    const newEntities = [...worldConfiguration];
    newEntities[index] = { ...newEntities[index], entity: name };
    onUpdateWorldConfiguration(newEntities);
  };

  const removeEntity = (index: number) => {
    onUpdateWorldConfiguration(
      worldConfiguration.filter((_, i) => i !== index)
    );
  };

  const getAvailableComponent = (name: string): Component => {
    //const component = availableComponents[name]; 

    const component = 
        availableComponents.find((component) => component.name == name);
    if(!component) {
      // TODO throw error
      throw Error("adwad");
    }
    return component;
  }

  // Component management
  const addComponent = (entityIndex: number) => { // , componentName: string
    //const newComponent = getAvailableComponent(componentName);

    const newComponent = { name: "", module: new Module(""), fields: {} };

    const newEntities = [...worldConfiguration];
    newEntities[entityIndex].components.push(newComponent);
    onUpdateWorldConfiguration(newEntities);
  };

  // const createUpdatedComponentData = (
  //   entityIndex: number,
  //   componentName: number,
  //   field: string,
  //   value: string,
  //   entities: EntityConfiguration[]
  // ): EntityConfiguration[] => {
  //   const newEntities = [...entities];
    
  //   if (field === 'name') {
  //     // When component name changes, reset fields to defaults
  //     const newName = value;
  //     const component = getAvailableComponent(newName);
      
  //     newEntities[entityIndex].components[componentName] = component;
  //   } else {
  //     newEntities[entityIndex].components[componentName].fields[field].value = value;
  //   }
    
  //   return newEntities;
  // };

  const updateComponent = (
    entityIndex: number, 
    componentIndex: number, 
    fields: ComponentFields, 
    //value: any, 
  ) => {
    const newEntities = [...worldConfiguration];
    
    // if (field === 'name') {
    //   // Assign a different component
    //   const newName = value;
    //   const component = getAvailableComponent(newName);
      
    //   newEntities[entityIndex].components[componentIndex] = component;
    // } else {
    newEntities[entityIndex].components[componentIndex].fields = fields;//[field].value = value;
    //}
    onUpdateWorldConfiguration(newEntities);
  };

  const replaceComponent = (
    entityIndex: number, 
    componentIndex: number, 
    componentName: string, 
    //value: any, 
  ) => {
    const newEntities = [...worldConfiguration];
    
    const component = getAvailableComponent(componentName);
    
    newEntities[entityIndex].components[componentIndex] = component;

    onUpdateWorldConfiguration(newEntities);
  };

  const removeComponent = (entityIndex: number, componentIndex: number) => {
    const newEntities = [...worldConfiguration];

    // Use splice to remove the component, not delete (which leaves undefined entries)
    newEntities[entityIndex].components.splice(componentIndex, 1);

    onUpdateWorldConfiguration(newEntities);
  };

  const renderEntityBuilder = (entity: EntityConfiguration, entityIndex: number) => (
    <div 
      key={entityIndex} 
      className="p-6 border border-border rounded-lg bg-card space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor={`entity-name-${entityIndex}`}>Entity Name</Label>
        <Input
          id={`entity-name-${entityIndex}`}
          type="text"
          value={entity.entity}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            updateEntityName(entityIndex, e.target.value)
          }
          placeholder="e.g., TestEntity"
          className="w-full"
        />
      </div>
      
      <div className="mt-4 p-4 bg-accent/30 rounded-md space-y-4">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">Components</h4>
        </div>
        
        <div className="space-y-3">
          {entity.components.map((component, componentIndex) => 
            //const componentSchema = availableComponents.find(c => c.name === component.name);
            
            renderComponentBuilder(component, entityIndex, componentIndex)
          )}
          
          <Button 
            variant="outline" 
            onClick={() => addComponent(entityIndex)}
            className="gap-2 w-full"
          >
            <Plus className="h-4 w-4" />
            Add Component
          </Button>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => removeEntity(entityIndex)}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Remove Entity
        </Button>
      </div>
    </div>
  
  )

  const renderComponentBuilder = (component: Component, entityIndex: number, componentIndex: number) => (
    <div 
      key={componentIndex} 
      className="p-4 border border-border rounded-md bg-background space-y-3"
    >
      <div className="space-y-2">
        <Label htmlFor={`component-${entityIndex}-${componentIndex}`}>Component</Label>
        <select
          id={`component-${entityIndex}-${componentIndex}`}
          value={component.name}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
            replaceComponent(entityIndex, componentIndex, e.target.value)
          }
          disabled={availableComponents.length === 0}
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </select>
      </div>
      
      {component.name && (
        <div className="space-y-2">
          <Label>Component Fields</Label>
          <ComponentFieldsBuilder
            fields={component.fields}
            onUpdate={
              (fields: ComponentFields) => 
                updateComponent(entityIndex, componentIndex, fields) 
            }
          />
        </div>
      )}
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => removeComponent(entityIndex, componentIndex)}
        className="gap-2 w-full"
      >
        <Trash2 className="h-4 w-4" />
        Remove Component
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {worldConfiguration.map((entity, entityIndex) => 
          renderEntityBuilder(entity, entityIndex)
        )}
      </div>
      
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={addEntity}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Entity
        </Button>
      </div>
    </div>
  );
};