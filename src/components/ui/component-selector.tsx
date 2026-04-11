import React from "react";
import type { Component } from "@/common/types";

export interface ComponentSelectorProps {
  id: string;
  value: string;
  onChange: (newName: string) => void;
  availableComponents: Component[];
  disabled?: boolean;
}

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  id,
  value,
  onChange,
  availableComponents,
  disabled = false,
}) => {
  const maxComponentNameLength = 48;

  const trimString = (str: string) => {
    return str.length > maxComponentNameLength
      ? `${str.substring(0, maxComponentNameLength)} ...`
      : str;
  };

  const getOptionDisplayString = (comp: Component) => {
    return `${trimString(comp.name)} (${trimString(comp.module.fullPath)})`;
  };

  return (
    <select
      id={id}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
        onChange(e.target.value)
      }
      disabled={disabled || availableComponents.length === 0}
      className="w-fit min-w-[200px] max-w-[300px] px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <option value="" disabled hidden>
        {availableComponents.length === 0
          ? "No components available in selected modules"
          : "Add a component..."}
      </option>
      {availableComponents.map((comp) => (
        <option key={comp.name} value={comp.id}>
          {getOptionDisplayString(comp)}
        </option>
      ))}
    </select>
  );
};
