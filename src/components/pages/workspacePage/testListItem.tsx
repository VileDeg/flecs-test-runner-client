import React, { useState, type JSX, type MouseEvent } from "react";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import {
  Play,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileOutput,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@components/ui/tooltip";

import { TestStatus, type WorkspaceTest } from "@/common/workspaceTypes";

interface StatusStyle {
  readonly icon: JSX.Element;
  readonly color: string;
}

const TEST_STATUS_STYLE: Record<TestStatus, StatusStyle> = {
  [TestStatus.PASSED]: {
    icon: <CheckCircle className="h-4 w-4" />,
    color:
      "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  [TestStatus.FAILED]: {
    icon: <XCircle className="h-4 w-4" />,
    color:
      "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  [TestStatus.RUNNING]: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color:
      "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  [TestStatus.INVALID]: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color:
      "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
  },
  [TestStatus.TIMEOUT]: {
    icon: <Clock className="h-4 w-4" />,
    color:
      "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  [TestStatus.IDLE]: {
    icon: <AlertCircle className="h-4 w-4" />,
    color:
      "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  },
} as const;

export interface TestListItemProps {
  wsTest: WorkspaceTest;
  onRunTest: (testId: string) => void;
  onRemoveTest: (testId: string) => void;
  onSelectTest: (testId: string) => void;
  onExportTest: (testId: string) => void;
  // Selection mode props
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (testId: string) => void;
}

const TestListItem: React.FC<TestListItemProps> = ({
  wsTest,
  onRunTest,
  onRemoveTest,
  onSelectTest,
  onExportTest,
  // Selection mode props
  isSelectionMode,
  isSelected,
  onToggleSelection,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const unitTest = wsTest.testProperties.test;

  const statusStyle = TEST_STATUS_STYLE[wsTest.status];

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOnStatusMessageExpanded = (e: MouseEvent) => {
    e.stopPropagation(); // Prevents onSelectTest
    setIsExpanded(!isExpanded);
  };

  const renderActionButtons = () => (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRunTest(wsTest.id)}
        className="gap-1"
        disabled={isSelected}
      >
        <Play className="h-3 w-3" />
        Run
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onExportTest(wsTest.id)}
        className="gap-1"
        disabled={isSelected}
      >
        <FileOutput className="h-3 w-3" />
        Export
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemoveTest(wsTest.id)}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        disabled={isSelected}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <div
      className={cn(
        "group p-4 bg-card border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
        isSelected ? "border-2 border-primary" : "border border-border",
      )}
      onClick={(_) => {
        if (isSelectionMode) {
          onToggleSelection(wsTest.id);
        } else {
          onSelectTest(wsTest.id);
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground">
              {unitTest.name}
            </h3>
            <Badge
              variant="outline"
              className={cn("font-medium", statusStyle.color)}
            >
              {statusStyle.icon}
              <span className="ml-1 capitalize">{wsTest.status}</span>
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground mb-3">
            <div className="flex items-center gap-4">
              <span>Systems: {unitTest.systems.length}</span>
              <span>•</span> {/*TODO: use a divider? */}
              <span>Last updated: {formatTime(wsTest.lastUpdated)}</span>
            </div>
            {wsTest.statusMessage && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p
                    onClick={handleOnStatusMessageExpanded}
                    className={cn(
                      "text-foreground/80 cursor-pointer transition-all",
                      isExpanded ? "whitespace-pre-wrap" : "line-clamp-1",
                    )}
                  >
                    {wsTest.statusMessage}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isExpanded ? "Click to collapse" : "Click to expand"}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {renderActionButtons()}
      </div>

      <Separator className="my-3" />

      <div className="text-xs text-muted-foreground flex justify-between">
        <span>Created: {new Date(wsTest.createdAt).toLocaleDateString()}</span>
        <span>ID: {wsTest.id}</span>
      </div>
    </div>
  );
};

export default TestListItem;
