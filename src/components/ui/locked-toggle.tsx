import React from "react";
import { Button } from "./button";
import { LockKeyhole, LockKeyholeOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LockedToggleProps {
  locked: boolean | null;
  onChange: (locked: boolean) => void;
  className?: string;
  title: string;
}

export const LockedToggle: React.FC<LockedToggleProps> = ({
  locked,
  onChange,
  className,
  title,
}) => {
  const handleToggle = () => {
    onChange(!locked);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-6 w-6 p-0",
        locked === null && "opacity-50", //  cursor-not-allowed
        locked === false && "text-muted-foreground",
        className,
      )}
      onClick={handleToggle}
      title={title}
    >
      {locked ? (
        <LockKeyhole className="h-3 w-3" />
      ) : (
        <LockKeyholeOpen className="h-3 w-3" />
      )}
    </Button>
  );
};
