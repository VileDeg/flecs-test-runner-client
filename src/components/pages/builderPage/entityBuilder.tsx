import React, { useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Trash2, Package, ChevronDown, ChevronRight } from "lucide-react";

import type { 
  Component,
  EntityConfiguration,
} from "@/common/types";

import { ComponentBuilder } from "./componentBuilder";
import { useBuilder } from "@/contexts/builderContext";
import { ComponentSelector } from "@/components/ui/component-selector";
import { OperatorControls } from "./operatorControls";
import { OperatorType } from "@/common/coreTypes";

export interface EntityBuilderProps {
  configuration: EntityConfiguration;
  isExpected: boolean;
  onUpdate: (updates: Partial<EntityConfiguration> | null) => void;
}

export const EntityBuilder: React.FC<EntityBuilderProps> = ({
  configuration,
  isExpected,
  onUpdate
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const {
    availableComponents,
    changeEntityName,
    removeEntity,
    addComponent,
    onOperatorChanged,
    getOperatorType
  } = useBuilder();


  const isEntityHaveComponent = (component: Component): boolean => {
    return configuration.components.some(
      comp => comp.id === component.id
    )
  } 
  
  const getAvailableComponents = () => {
    return availableComponents.filter(comp => !isEntityHaveComponent(comp))
  }

  const getSupportedOperatorTypes = () => {
    return [OperatorType.Eq, OperatorType.Neq]
  }

  const handleOnComponentUpdated = (updates: Partial<Component> | null, componentIndex: number) => {
    const updatedComponents = updates === null
      ? configuration.components.filter((_, i) => i !== componentIndex)
      : configuration.components.map((c, i) => 
          i === componentIndex ? { ...c, ...updates } : c
        );

    onUpdate({
      ...configuration,
      components: updatedComponents
    });
  }
  const renderOperatorControls = () => (
    <OperatorControls
      operatorType={getOperatorType(configuration.id)}
      supportedOperators={getSupportedOperatorTypes()}
      onOperatorTypeChange={(type) => onOperatorChanged(type, configuration.id)}
    >
    </OperatorControls>
  )

  const renderCollapseToggle = () => (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 mt-6" 
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </Button>
  )

  const TODO = "aboba"
  const renderEntityHeaderRegion = (entity: EntityConfiguration) => (
    <div className="flex justify-between items-start">
      {renderCollapseToggle()}
      <div className="space-y-2 flex-1">
        <Label htmlFor={`entity-name-${TODO}`}>Entity Name</Label>
        <Input
          id={`entity-name-${TODO}`}
          type="text"
          value={entity.entityName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            changeEntityName(configuration.id, e.target.value)
          }
          placeholder="e.g., TestEntity"
          className="w-auto"
          disabled={isExpected}
        />
      </div>
      {isExpected && renderOperatorControls()}
      {!isExpected && renderRemoveButton()}
    </div>
  )

  const renderComponentSelector = (componentId: string) => (
      <ComponentSelector
        id={`${componentId}`}
        value={componentId}
        onChange={(id: string) => addComponent(configuration.id, id)}
        availableComponents={getAvailableComponents()}
      >
      </ComponentSelector>
    )

  const renderComponentsRegion = (entity: EntityConfiguration) => (
    <div className="mt-4 p-4 bg-accent/30 rounded-md space-y-4">
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">Components</h4>
      </div>
      
      <div className="space-y-3">
        {entity.components.map((component, componentIndex) => 
          <ComponentBuilder
            key={componentIndex}
            index={componentIndex}
            isExpected={isExpected}
            entityHeader={{id: configuration.id, entityName: configuration.entityName}}
            component={component}
            onUpdate={(updates) => handleOnComponentUpdated(updates, componentIndex)}
          >
          </ComponentBuilder>
        )}
        
        {!isExpected && renderComponentSelector("")}
      </div>
    </div>
  )


  const renderRemoveButton = () => (
    <div className="flex justify-end">
      <Button 
        variant="destructive" 
        size="sm"
        onClick={() => removeEntity(configuration.id)}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Remove
      </Button>
    </div>
  )

  return (
    <div className="p-6 border border-border rounded-lg bg-card space-y-4">
      <div className="flex items-start gap-4">
        

        <div className="flex-1">
          <div className="flex-1">
            
            {renderEntityHeaderRegion(configuration)}
          </div>
          
          {/* Conditional Rendering of the Components Region */}
          {isExpanded && renderComponentsRegion(configuration)}
        </div>
      </div>
    </div>
  );
};