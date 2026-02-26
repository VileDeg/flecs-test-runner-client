import React, { useState } from "react";
import { Button } from "./button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OperatorType } from "@/common/coreTypes";

import { OPERATOR_LABELS } from "@/components/common/constants";

export interface OperatorDropdownProps {
  value: OperatorType;
  onChange: (value: OperatorType) => void;
  //level: OperatorLevel;
  supportedOperators: OperatorType[];
  //locked?: boolean;
  //onInheritanceToggle?: () => void;
  disabled?: boolean;
  className?: string;
}

export const OperatorDropdown: React.FC<OperatorDropdownProps> = ({
  value,
  onChange,
  supportedOperators,
  //level,
  //locked = false,
  //onInheritanceToggle,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  //const availableOperators = level === OperatorLevel.ENTITY ? ENTITY_OPERATORS : ALL_OPERATORS;

  const handleOperatorSelect = (operator: OperatorType) => {
    //if (isValidOperatorForLevel(operator, level)) {
      onChange(operator);
      setIsOpen(false);
      // If user selects a different operator, remove inheritance
      // if (inherited && onInheritanceToggle) {
      //   onInheritanceToggle();
      // }
      //}
  };

  // const handleLockClick = (e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   if (onInheritanceToggle) {
  //     onInheritanceToggle();
  //     if (inherited) {
  //       // Unlocking - open dropdown
  //       setIsOpen(true);
  //     }
  //   }
  // };

  return (
    <div className={cn("relative inline-block", className)}>
      <div className="flex items-center gap-1">
        {/* Lock/Unlock icon for inheritance 
        {inherited && onInheritanceToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 p-0"
            onClick={handleLockClick}
            disabled={disabled}
            title={inherited ? "Inherited from parent - click to unlock" : "Click to lock and inherit"}
          >
            {inherited ? (
              <Lock className="h-3 w-3 text-muted-foreground" />
            ) : (
              <Unlock className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
        )}*/}

        {/* Operator dropdown */}
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-7 px-2 text-xs font-mono",
              //locked && "text-muted-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && setIsOpen(!isOpen)} //  && !inherited
            disabled={disabled}
            title={"Select comparison operator"}
          >
            <span>{OPERATOR_LABELS[value]}</span>
            {!disabled && ( // !inherited && 
              <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
            )}
          </Button>

          {/* Dropdown menu */}
          {isOpen && !disabled && ( //  && !inherited
            <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg min-w-[80px]">
              {supportedOperators.map((operator) => (
                <button
                  key={operator}
                  type="button"
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm hover:bg-accent",
                    value === operator && "bg-accent font-medium"
                  )}
                  onClick={() => handleOperatorSelect(operator)}
                >
                  {OPERATOR_LABELS[operator]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};