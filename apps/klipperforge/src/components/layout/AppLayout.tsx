import { Cpu } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { fetchBuildStatus } from "@/api/firmware";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { featureFlags } from "@/lib/feature-flags";
import type { AppView } from "@/types/views";
import { CalibrationView } from "../calibration/CalibrationView";
import { DocumentationView } from "../documentation/DocumentationView";
import { ErrorBoundary } from "../ErrorBoundary";
import { FeatureDisabled } from "../FeatureDisabled";
import { FirmwareView } from "../firmware/FirmwareView";
import { StandaloneFlashTool } from "../firmware/StandaloneFlashTool";
import { SharedConfigView } from "../storage/SharedConfigView";
import { WipBanner } from "../WipBanner";
import { ConfigurationView } from "./ConfigurationView";
import { Header } from "./Header";

const pathToView: Record<string, AppView> = {
  "/": "configuration",
  "/documentation": "documentation",
  "/calibration": "calibration",
  "/firmware": "firmware",
};

const viewToPath: Record<AppView, string> = {
  configuration: "/",
  documentation: "/documentation",
  calibration: "/calibration",
  firmware: "/firmware",
};

type FirmwareBadge = "idle" | "building" | "completed" | "failed";

function parseShareToken(pathname: string): string | null {
  const match = pathname.match(/^\/shared\/(.+)$/);
  return match ? match[1] : null;
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const shareToken = useMemo(() => parseShareToken(location.pathname), [location.pathname]);
  const activeView = useMemo<AppView>(() => pathToView[location.pathname] ?? "configuration", [location.pathname]);
  const [firmwareBadge, setFirmwareBadge] = useState<FirmwareBadge>(() =>
    featureFlags.firmwareBuilder && sessionStorage.getItem("firmware:jobId") !== null ? "building" : "idle",
  );

  useEffect(
    function pollFirmwareBuildStatusEffect() {
      if (!featureFlags.firmwareBuilder || firmwareBadge !== "building") return;

      async function checkBuildStatus() {
        const jobId = sessionStorage.getItem("firmware:jobId");
        if (!jobId) {
          setFirmwareBadge("idle");
          return;
        }

        try {
          const status = await fetchBuildStatus(jobId);
          switch (status.status) {
            case "completed":
              setFirmwareBadge("completed");
              break;
            case "failed":
              setFirmwareBadge("failed");
              break;
          }
        } catch {
          setFirmwareBadge("idle");
        }
      }

      checkBuildStatus();
      const interval = setInterval(checkBuildStatus, 5000);
      return () => clearInterval(interval);
    },
    [firmwareBadge],
  );

  useEffect(
    function clearBadgeOnFirmwareTabEffect() {
      if (activeView === "firmware" && (firmwareBadge === "completed" || firmwareBadge === "failed")) {
        setFirmwareBadge("idle");
      }
    },
    [activeView, firmwareBadge],
  );

  const handleFirmwareBuildStart = useCallback(() => {
    setFirmwareBadge("building");
  }, []);

  const handleFirmwareBuildFail = useCallback(() => {
    setFirmwareBadge("failed");
  }, []);

  const handleViewChange = useCallback(
    (view: AppView) => {
      navigate(viewToPath[view]);
    },
    [navigate],
  );

  function renderView() {
    switch (activeView) {
      case "configuration":
        return <ConfigurationView />;
      case "documentation":
        return (
          <ErrorBoundary fallbackClassName="h-full">
            <DocumentationView />
          </ErrorBoundary>
        );
      case "calibration":
        return (
          <ErrorBoundary fallbackClassName="h-full">
            <CalibrationView />
          </ErrorBoundary>
        );
      case "firmware":
        if (!featureFlags.firmwareBuilder) {
          if (featureFlags.browserFlashTool) {
            return (
              <div className="flex flex-1 items-start justify-center overflow-y-auto p-8">
                <div className="w-full max-w-lg space-y-6">
                  <StandaloneFlashTool />
                </div>
              </div>
            );
          }
          return (
            <FeatureDisabled
              icon={<Cpu className="size-6" />}
              title="Firmware Builder"
              description="The firmware builder requires a running build server. See the documentation for setup instructions."
            />
          );
        }
        return (
          <ErrorBoundary fallbackClassName="h-full">
            <FirmwareView onBuildStart={handleFirmwareBuildStart} onBuildFail={handleFirmwareBuildFail} />
          </ErrorBoundary>
        );
    }
  }

  if (shareToken && featureFlags.configStorage) {
    return (
      <div className="flex h-screen flex-col">
        <WipBanner />
        <Header activeView={activeView} onViewChange={handleViewChange} firmwareBadge={firmwareBadge} />
        <Suspense fallback={<LoadingSpinner className="flex-1" />}>
          <SharedConfigView shareToken={shareToken} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <WipBanner />
      <Header activeView={activeView} onViewChange={handleViewChange} firmwareBadge={firmwareBadge} />
      <Suspense fallback={<LoadingSpinner className="flex-1" />}>{renderView()}</Suspense>
    </div>
  );
}
