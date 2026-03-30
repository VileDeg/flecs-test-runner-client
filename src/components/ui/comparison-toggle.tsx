import React from "react";
import { Button } from "./button";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComparisonToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
  title: string;
}

export const ComparisonToggle: React.FC<ComparisonToggleProps> = ({
  enabled,
  onChange,
  className,
  title,
}) => {
  const handleToggle = () => {
    onChange(!enabled);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-6 w-6 p-0",
        !enabled && "text-muted-foreground",
        className
      )}
      onClick={handleToggle}
      title={title}
    >
      {enabled ? (
        <Eye className="h-3 w-3" />
      ) : (
        <EyeOff className="h-3 w-3" />
      )}
    </Button>
  );
};