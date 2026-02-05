import React from "react";
import { ComponentFields } from "./componentFields.tsx";
import { type FlecsMetadata } from "@common/flecsMetadataService.ts";
import type * as Core from "@common/coreTypes.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Package } from "lucide-react";

export interface EntityBuilderProps {
  entities: Core.EntityData[];
  availableComponents: FlecsMetadata.Component[];
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
  onUpdateEntityName,
  onRemoveEntity,
  onAddEntity,
  onUpdateComponent,
  onRemoveComponent,
  onAddComponent,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {entities.map((entity, entityIndex) => (
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
                  onUpdateEntityName(entityIndex, e.target.value)
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
                {entity.components.map((component, componentIndex) => {
                  const componentSchema = availableComponents.find(c => c.name === component.name);
                  
                  return (
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
                            onUpdateComponent(entityIndex, componentIndex, 'name', e.target.value)
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
                      
                      {component.name && componentSchema && (
                        <div className="space-y-2">
                          <Label>Component Fields</Label>
                          <ComponentFields
                            component={component}
                            componentSchema={componentSchema}
                            onUpdate={
                              (field:string, value:any) => 
                                onUpdateComponent(entityIndex, componentIndex, field, value) 
                            }
                          />
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onRemoveComponent(entityIndex, componentIndex)}
                        className="gap-2 w-full"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove Component
                      </Button>
                    </div>
                  );
                })}
                
                <Button 
                  variant="outline" 
                  onClick={() => onAddComponent(entityIndex)}
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
                onClick={() => onRemoveEntity(entityIndex)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Remove Entity
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={onAddEntity}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Entity
        </Button>
      </div>
    </div>
  );
};