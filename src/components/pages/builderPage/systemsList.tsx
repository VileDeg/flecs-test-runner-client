import React from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Plus, Trash2 } from "lucide-react";

import type {
  SystemInvocation,
  System,
} from "@/common/types";

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

  const addSystem = () => {
    onUpdateSystems([...selectedSystems, { name: "", timesToRun: 1 }]);
  };

  const updateSystem = (index: number, field: keyof SystemInvocation, value: string | number) => {
    const newSystems = [...selectedSystems];
    newSystems[index] = { ...newSystems[index], [field]: value };
    onUpdateSystems(newSystems);
  };

  const removeSystem = (index: number) => {
    onUpdateSystems(selectedSystems.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {selectedSystems.map((system, index) => (
          <div 
            key={index} 
            className="p-4 border border-border rounded-md bg-card flex flex-wrap gap-4 items-center"
          >
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label htmlFor={`system-name-${index}`}>System Name</Label>
              <select
                id={`system-name-${index}`}
                value={system.name}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                  updateSystem(index, 'name', e.target.value)
                }
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select a system...</option>
                {availableSystems.map(sys => (
                  <option key={sys.name} value={sys.module.fullPath + "." + sys.name}>
                    {sys.name} {sys.module && `(${sys.module.fullPath})`}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2 w-32">
              <Label htmlFor={`system-times-${index}`}>Times to Run</Label>
              <Input
                id={`system-times-${index}`}
                type="number"
                value={system.timesToRun}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  updateSystem(index, 'timesToRun', parseInt(e.target.value) || 1)
                }
                min="1"
                className="w-full"
              />
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => removeSystem(index)}
              className="gap-2 mt-6"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          </div>
        ))}
      </div>
      
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={addSystem}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add System
        </Button>
      </div>
    </div>
  );
};