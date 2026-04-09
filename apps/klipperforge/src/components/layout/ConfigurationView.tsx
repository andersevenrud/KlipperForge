import { CircuitBoard, Code, Settings } from "lucide-react";
import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { useConfigPersistence } from "@/hooks/use-config-persistence";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { ErrorBoundary } from "../ErrorBoundary";
import { ConfigPanel } from "./ConfigPanel";
import { EditorPanel } from "./EditorPanel";
import { IllustrationPanel } from "./IllustrationPanel";
import { SidebarActions } from "./SidebarActions";

type MobileTab = "config" | "pcb" | "editor";

interface MobileTabItem {
  id: MobileTab;
  label: string;
  icon: React.ReactNode;
}

const MOBILE_TABS: MobileTabItem[] = [
  { id: "config", label: "Config", icon: <Settings className="size-4" /> },
  { id: "pcb", label: "PCB", icon: <CircuitBoard className="size-4" /> },
  { id: "editor", label: "Editor", icon: <Code className="size-4" /> },
];

function MobileConfigurationLayout() {
  const [activeTab, setActiveTab] = useState<MobileTab>("config");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 flex gap-1 border-b border-border bg-card px-2 py-1">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "config" && (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto bg-card p-4">
            <ErrorBoundary fallbackClassName="flex-1">
              <ConfigPanel mobile />
            </ErrorBoundary>
          </div>
          <SidebarActions />
        </div>
      )}
      {activeTab === "pcb" && (
        <ErrorBoundary fallbackClassName="h-full">
          <IllustrationPanel />
        </ErrorBoundary>
      )}
      {activeTab === "editor" && (
        <ErrorBoundary fallbackClassName="h-full">
          <EditorPanel />
        </ErrorBoundary>
      )}
    </div>
  );
}

function DesktopConfigurationLayout() {
  return (
    <Group orientation="horizontal" className="flex-1">
      <Panel defaultSize={30} minSize={20} maxSize={50} style={{ minWidth: 360 }}>
        <div className="flex h-full flex-col">
          <ErrorBoundary fallbackClassName="flex-1">
            <ConfigPanel />
          </ErrorBoundary>
          <SidebarActions />
        </div>
      </Panel>
      <Separator className="w-1.5 bg-border transition-colors hover:bg-primary/50" />
      <Panel defaultSize={70}>
        <Group orientation="vertical">
          <Panel defaultSize={40} minSize={20}>
            <ErrorBoundary fallbackClassName="h-full">
              <IllustrationPanel />
            </ErrorBoundary>
          </Panel>
          <Separator className="h-1.5 bg-border transition-colors hover:bg-primary/50" />
          <Panel defaultSize={60} minSize={20}>
            <ErrorBoundary fallbackClassName="h-full">
              <EditorPanel />
            </ErrorBoundary>
          </Panel>
        </Group>
      </Panel>
    </Group>
  );
}

export function ConfigurationView() {
  useConfigPersistence();
  const isMobile = useIsMobile();

  return isMobile ? <MobileConfigurationLayout /> : <DesktopConfigurationLayout />;
}
