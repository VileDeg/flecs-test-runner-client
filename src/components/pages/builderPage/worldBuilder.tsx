import React from "react";
import { Button } from "@components/ui/button";
import { Plus } from "lucide-react";

import type { EntityConfiguration, WorldConfiguration } from "@/common/types";

import { EntityBuilder } from "./entityBuilder";
import { useBuilder } from "@/contexts/builderContext";

export interface WorldBuilderProps {
  configuration: WorldConfiguration;
  isExpected: boolean;
  // Null signalizes to remove from
  onUpdate: (worldConfiguration: WorldConfiguration) => void; // TODO: use partial?
}

export const WorldBuilderComponent: React.FC<WorldBuilderProps> = ({
  configuration,
  isExpected,
  onUpdate,
}) => {
  const { addEntity } = useBuilder();

  const handleOnEntityUpdated = (
    updates: Partial<EntityConfiguration> | null,
    entityIndex: number,
  ) => {
    const updatedEntities =
      updates === null
        ? configuration.filter((_, i) => i !== entityIndex)
        : configuration.map((c, i) =>
            i === entityIndex ? { ...c, ...updates } : c,
          );

    onUpdate(updatedEntities);
  };

  const renderAddEntityButton = () => (
    <div className="flex justify-center">
      <Button variant="outline" onClick={addEntity} className="gap-2">
        <Plus className="h-4 w-4" />
        Add Entity
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {configuration.map((entity, entityIndex) => (
          <EntityBuilder
            key={entityIndex}
            configuration={entity}
            isExpected={isExpected}
            onUpdate={(updates) => handleOnEntityUpdated(updates, entityIndex)}
          ></EntityBuilder>
        ))}
      </div>

      {!isExpected && renderAddEntityButton()}
    </div>
  );
};
