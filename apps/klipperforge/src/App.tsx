import { EditorScrollProvider } from "@klipperforge/editor";
import { Suspense } from "react";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { AppLayout } from "./components/layout/AppLayout";
import { ConfirmDiscardProvider } from "./components/layout/ConfirmDiscardDialog";
import { ConfigProvider } from "./context/config-context";
import { McuProvider } from "./context/mcu-context";

export function App() {
  return (
    <ConfigProvider>
      <ConfirmDiscardProvider>
        <Suspense fallback={<LoadingSpinner className="h-screen" />}>
          <McuProvider>
            <EditorScrollProvider>
              <AppLayout />
            </EditorScrollProvider>
          </McuProvider>
        </Suspense>
      </ConfirmDiscardProvider>
    </ConfigProvider>
  );
}
