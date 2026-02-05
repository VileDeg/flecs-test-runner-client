import React from "react";
import type { FlecsMetadata } from "@common/flecsMetadataService.ts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CheckSquare, Square } from "lucide-react";

interface ModuleSelectorProps {
  modules: FlecsMetadata.Module[];
  selectedModules: string[];
  onSelectionChange: (selectedModules: string[]) => void;
  loading?: boolean;
}

export const ModuleSelector: React.FC<ModuleSelectorProps> = ({
  modules,
  selectedModules,
  onSelectionChange,
  loading = false
}) => {
  const handleToggleModule = (moduleFullPath: string) => {
    if (selectedModules.includes(moduleFullPath)) {
      onSelectionChange(selectedModules.filter(m => m !== moduleFullPath));
    } else {
      onSelectionChange([...selectedModules, moduleFullPath]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(modules.map(m => m.fullPath));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Module Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading modules...</p>
        </CardContent>
      </Card>
    );
  }

  if (modules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Module Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No modules found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Module Selection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select the modules to filter systems and components. 
          Selected: {selectedModules.length} / {modules.length}
        </p>
        
        <div className="flex justify-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSelectAll}
            className="gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            Select All
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDeselectAll}
            className="gap-2"
          >
            <Square className="h-4 w-4" />
            Deselect All
          </Button>
        </div>

        <div className="max-h-72 overflow-y-auto p-3 bg-card border border-border rounded-md">
          <div className="space-y-2">
            {modules.map((module) => (
              <div 
                key={module.fullPath} 
                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
              >
                <Checkbox
                  id={`module-${module.fullPath}`}
                  checked={selectedModules.includes(module.fullPath)}
                  onCheckedChange={() => handleToggleModule(module.fullPath)}
                  className="h-5 w-5"
                />
                <Label 
                  htmlFor={`module-${module.fullPath}`}
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <span className="font-medium text-foreground">{module.name}</span>
                  {module.fullPath !== module.name && (
                    <span className="text-sm text-muted-foreground">
                      ({module.fullPath})
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};