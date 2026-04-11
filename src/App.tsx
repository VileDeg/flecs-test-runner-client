import { useState } from "react";

import { FlecsConnectionProvider } from "@/contexts/flecsConnectionContext";
import { ToastProvider } from "@/contexts/toastContext";
import { WorkspaceProvider } from "@/contexts/workspaceContext";

import { WorkspacePage } from "@components/pages/workspacePage/workspacePage.tsx";
import { TestBuilder } from "@pages/builderPage/builderPage.tsx";

import { useFlecsConnection } from "@contexts/flecsConnectionContext";

import { FLECS_PORT } from "@common/constants.ts";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { ThemeToggle } from "@components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  RefreshCw,
  XCircle,
  Wrench,
  FolderOpen,
} from "lucide-react";
import { BuilderProvider } from "@/contexts/builderContext";
import { TooltipProvider } from "@components/ui/tooltip";
import { MetadataLoaderProvider } from "./contexts/metadataLoaderContext";

// Main App Component
export const App = () => {
  return (
    <TooltipProvider>
      <ToastProvider>
        <FlecsConnectionProvider>
          <MetadataLoaderProvider>
            <WorkspaceProvider>
              <AppContent />
            </WorkspaceProvider>
          </MetadataLoaderProvider>
        </FlecsConnectionProvider>
      </ToastProvider>
    </TooltipProvider>
  );
};

// App content with connection context
const AppContent = () => {
  const [currentPage, setCurrentPage] = useState<"workspace" | "builder">(
    "workspace",
  );

  const { status } = useFlecsConnection();

  // Navigation functions
  const goToWorkspacePage = () => {
    setCurrentPage("workspace");
  };

  const goToBuilderPage = () => {
    setCurrentPage("builder");
  };

  // Render the top bar when connected
  const renderTopBar = () => (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-card border-b border-border shadow-md">
      <div className="flex items-center gap-6">
        <h1 className="text-2xl font-semibold text-foreground">
          Flecs Test Runner
        </h1>
        <Badge
          variant="outline"
          className={cn(
            "font-medium",
            status === "Connected" &&
              "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200 dark:border-green-800",
            (status === "Connecting" || status === "RetryConnecting") &&
              "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
            status === "Disconnected" &&
              "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200 dark:border-red-800",
          )}
        >
          {status === "Connected" && <CheckCircle className="h-3 w-3 mr-1" />}
          {(status === "Connecting" || status === "RetryConnecting") && (
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          )}
          {status === "Disconnected" && <XCircle className="h-3 w-3 mr-1" />}
          {status === "Connected" && "Connected"}
          {(status === "Connecting" || status === "RetryConnecting") &&
            "Connecting..."}
          {status === "Disconnected" && "Disconnected"}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant={currentPage === "builder" ? "default" : "outline"}
          size="sm"
          onClick={goToBuilderPage}
          className="gap-2"
        >
          <Wrench className="h-4 w-4" />
          Test Builder
        </Button>
        <Button
          variant={currentPage === "workspace" ? "default" : "outline"}
          size="sm"
          onClick={goToWorkspacePage}
          className="gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          Workspace
        </Button>
        <div className="h-6 w-px bg-border mx-1" />
        <ThemeToggle />
      </div>
    </div>
  );

  // Render centered content when not connected
  const renderLoadingContent = () => (
    <div className="font-sans p-12 max-w-4xl mx-auto text-center min-h-[60vh] flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold text-foreground mb-6">
        Unit Test Runner
      </h1>
      <div
        className={cn(
          "my-6 px-6 py-4 rounded-lg font-medium w-full max-w-md",
          (status === "Connecting" || status === "RetryConnecting") &&
            "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
          status === "Connected" &&
            "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
          status === "Disconnected" &&
            "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
        )}
      >
        {(status === "Connecting" || status === "RetryConnecting") &&
          `Trying to connect to port ${FLECS_PORT}...`}
        {status === "Connected" && `✅ Connected to port ${FLECS_PORT}`}
        {status === "Disconnected" && "❌ Connection failed"}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="min-h-screen">
        {status === "Connected" ? (
          <>
            {renderTopBar()}
            <div className="font-sans pt-20 px-20 pb-20 max-w-full mx-auto">
              {currentPage === "builder" ? (
                <BuilderProvider>
                  <TestBuilder goToWorkspacePage={goToWorkspacePage} />
                </BuilderProvider>
              ) : (
                <WorkspacePage goToBuilderPage={goToBuilderPage} />
              )}
            </div>
          </>
        ) : (
          renderLoadingContent()
        )}
      </div>
    </div>
  );
};
