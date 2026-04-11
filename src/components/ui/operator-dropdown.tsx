import React, { useState } from "react";
import { Button } from "./button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OperatorType } from "@/common/coreTypes";

import { OPERATOR_LABELS } from "@/components/common/constants";

export interface OperatorDropdownProps {
  value: OperatorType;
  onChange: (value: OperatorType) => void;
  supportedOperators: OperatorType[];
  disabled?: boolean;
  className?: string;
}

export const OperatorDropdown: React.FC<OperatorDropdownProps> = ({
  value,
  onChange,
  supportedOperators,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOperatorSelect = (operator: OperatorType) => {
    onChange(operator);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <div className="flex items-center gap-1">
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "h-7 px-2 text-xs font-mono",
              disabled && "opacity-50 cursor-not-allowed",
            )}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            title={"Select comparison operator"}
          >
            <span>{OPERATOR_LABELS[value]}</span>
            {!disabled && <ChevronDown className="ml-1 h-3 w-3 opacity-50" />}
          </Button>

          {isOpen && !disabled && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg min-w-[80px]">
              {supportedOperators.map((operator) => (
                <button
                  key={operator}
                  type="button"
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-sm hover:bg-accent",
                    value === operator && "bg-accent font-medium",
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

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};
