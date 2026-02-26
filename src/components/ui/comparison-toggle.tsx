import React from "react";
import { Button } from "./button";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComparisonToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  //disabled?: boolean; // TODO: remove?
  className?: string;
  title: string;
}

export const ComparisonToggle: React.FC<ComparisonToggleProps> = ({
  enabled,
  onChange,
  //disabled = false,
  className,
  title,
}) => {
  const handleToggle = () => {
    //if (!disabled) {
      onChange(!enabled);
      //}
  };

  // const getToggleTitle = () => {
  //   if (title) return title;
  //   return enabled 
  //     ? "Included in comparison - click to exclude" 
  //     : "Excluded from comparison - click to include";
  // };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-6 w-6 p-0",
        !enabled && "text-muted-foreground",
        //disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={handleToggle}
      //disabled={disabled}
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