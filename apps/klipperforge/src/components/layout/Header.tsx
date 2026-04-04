import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/auth-context";
import { featureFlags } from "@/lib/feature-flags";
import type { AppView } from "@/types/views";
import { BookOpen, Cpu, Heart, LogIn, LogOut, Settings, User, Wrench } from "lucide-react";

interface HeaderProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  firmwareBadge?: "idle" | "building" | "completed" | "failed";
}

export function Header({ activeView, onViewChange, firmwareBadge }: HeaderProps) {
  const { user, isLoading, login, logout } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4">
      <div className="flex shrink-0 items-center gap-2">
        <img src="/klipperforge-icon.svg" alt="KlipperForge" className="size-8 rounded-md" />
        <h1 className="hidden text-lg font-semibold tracking-tight lg:block">KlipperForge</h1>
      </div>
      <Tabs value={activeView} onValueChange={(v) => onViewChange(v as AppView)} className="ml-auto flex-row">
        <TabsList>
          <TabsTrigger value="configuration">
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="documentation">
            <BookOpen className="h-4 w-4" />
            <span className="hidden md:inline">Documentation</span>
          </TabsTrigger>
          <TabsTrigger value="calibration">
            <Wrench className="h-4 w-4" />
            <span className="hidden md:inline">Calibration</span>
          </TabsTrigger>
          {(featureFlags.firmwareBuilder || featureFlags.browserFlashTool) && (
            <TabsTrigger value="firmware" className="relative">
              <Cpu className="h-4 w-4" />
              <span className="hidden md:inline">Firmware</span>
              {firmwareBadge === "building" && (
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary animate-pulse" />
              )}
              {firmwareBadge === "completed" && (
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-green-500" />
              )}
              {firmwareBadge === "failed" && (
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-destructive" />
              )}
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
      <div className="ml-auto flex items-center gap-2">
        {featureFlags.configStorage &&
          !isLoading &&
          (user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="max-w-[120px] gap-2">
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate">{user.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={login}>
              <LogIn className="mr-1 h-4 w-4" />
              Sign In
            </Button>
          ))}
        <Button variant="ghost" size="icon-sm" asChild className="shrink-0" title="Support KlipperForge">
          <a href="https://linktr.ee/andersevenrud" target="_blank" rel="noopener noreferrer">
            <Heart className="h-4 w-4" />
            <span className="sr-only">Donate</span>
          </a>
        </Button>
      </div>
    </header>
  );
}
