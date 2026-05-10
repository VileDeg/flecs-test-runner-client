import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Checkbox } from "@components/ui/checkbox";
import { Label } from "@components/ui/label";
import { CheckSquare, Square } from "lucide-react";

interface ModuleSelectorProps {
  availableModules: string[];
  selectedModules: string[];
  onSelectionChange: (selectedModules: string[]) => void;
  loading?: boolean;
}

export const ModuleSelector: React.FC<ModuleSelectorProps> = ({
  availableModules,
  selectedModules,
  onSelectionChange,
  loading = false,
}) => {
  const handleToggleModule = (module: string) => {
    const isSelected = selectedModules.some((m) => m === module);
    if (isSelected) {
      onSelectionChange(selectedModules.filter((m) => m !== module));
    } else {
      onSelectionChange([...selectedModules, module]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(availableModules);
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const isAllSelected = (): boolean => {
    return JSON.stringify(selectedModules) === JSON.stringify(availableModules);
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

  if (availableModules.length === 0) {
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
          Select the modules to filter systems and components. Selected:{" "}
          {selectedModules.length} / {availableModules.length}
        </p>

        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={isAllSelected() ? handleDeselectAll : handleSelectAll}
            className="gap-2"
          >
            {isAllSelected() ? (
              <>
                <Square className="h-4 w-4" />
                Deselect All
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4" />
                Select All
              </>
            )}
          </Button>
        </div>

        <div className="max-h-72 overflow-y-auto p-3 bg-card border border-border rounded-md">
          <div className="space-y-2">
            {availableModules.map((module) => (
              <div
                key={module}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
              >
                <Checkbox
                  id={`module-${module}`}
                  checked={selectedModules.some((m) => m === module)}
                  onCheckedChange={() => handleToggleModule(module)}
                  className="h-5 w-5"
                />
                <Label
                  htmlFor={`module-${module}`}
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <span className="font-medium text-foreground">{module}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
