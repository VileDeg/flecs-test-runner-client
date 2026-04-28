import React from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Plus, Minus, Trash2 } from "lucide-react";

import type { SystemInvocation, System } from "@/common/types";
import { MODULE_PATH_SEP } from "@/common/constants";

export interface SystemsListProps {
  selectedSystems: SystemInvocation[];
  availableSystems: System[];
  onUpdateSystems: (systems: SystemInvocation[]) => void;
}

export const SystemsList: React.FC<SystemsListProps> = ({
  selectedSystems,
  availableSystems,
  onUpdateSystems,
}) => {
  const makeSystemId = (system: System) =>
    system.module.fullPath + MODULE_PATH_SEP + system.name;

  const addSystem = () => {
    onUpdateSystems([
      ...selectedSystems,
      { name: makeSystemId(availableSystems[0]), timesToRun: 1 },
    ]);
  };

  const updateSystem = (index: number, updates: Partial<SystemInvocation>) => {
    onUpdateSystems(
      selectedSystems.map((systemInvocation, i) =>
        i === index ? { ...systemInvocation, ...updates } : systemInvocation,
      ),
    );
  };

  const removeSystem = (index: number) => {
    onUpdateSystems(selectedSystems.filter((_, i) => i !== index));
  };

  const renderSystemSelector = (system: SystemInvocation, index: number) => (
    <div className="space-y-2 flex-1 min-w-50">
      <Label htmlFor={`system-name-${index}`}>System Name</Label>
      <select
        id={`system-name-${index}`}
        value={system.name}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          updateSystem(index, { name: e.target.value })
        }
        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {availableSystems.map((sys) => (
          <option key={sys.name} value={makeSystemId(sys)}>
            {/* Assign module + name as invocation name */}
            {`${sys.name} (${sys.module.fullPath})`}
          </option>
        ))}
      </select>
    </div>
  );

  const renderTimesToRunCounter = (system: SystemInvocation, index: number) => {
    const value = system.timesToRun;

    const handleIncrement = () =>
      updateSystem(index, { timesToRun: value + 1 });
    const handleDecrement = () => {
      if (value > 1) {
        updateSystem(index, { timesToRun: value - 1 });
      }
    };

    return (
      <div className="space-y-2 w-32">
        <Label htmlFor={`system-times-${index}`}>Times to Run</Label>
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-r-none border-r-0 shrink-0"
            onClick={handleDecrement}
            disabled={value <= 1}
            type="button"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <Input
            id={`system-times-${index}`}
            type="number"
            value={value}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              updateSystem(index, { timesToRun: isNaN(val) ? 1 : val });
            }}
            className="h-9 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-l-none border-l-0 shrink-0"
            onClick={handleIncrement}
            type="button"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  };

  const renderAddButton = () => (
    <div className="flex justify-center">
      <Button variant="outline" onClick={addSystem} className="gap-2">
        <Plus className="h-4 w-4" />
        Add System
      </Button>
    </div>
  );

  const renderRemoveButton = (index: number) => (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => removeSystem(index)}
      className="gap-2 mt-6"
    >
      <Trash2 className="h-4 w-4" />
      Remove
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {selectedSystems.map((system, index) => (
          <div
            key={index}
            className="p-4 border border-border rounded-md bg-card flex flex-wrap gap-4 items-center"
          >
            {renderSystemSelector(system, index)}
            {renderTimesToRunCounter(system, index)}
            {renderRemoveButton(index)}
          </div>
        ))}
      </div>

      {availableSystems.length > 0 && renderAddButton()}
    </div>
  );
};
