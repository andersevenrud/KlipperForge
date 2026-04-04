import { AddSectionDropdown } from "@/components/sections/AddSectionDropdown";
import { McuBoardList } from "@/components/sections/McuBoardList";
import { OutputOptions } from "@/components/sections/OutputOptions";
import { PinNameActions } from "@/components/sections/PinNameActions";
import { SaveConfigList } from "@/components/sections/SaveConfigList";
import { Separator } from "@/components/ui/separator";

interface ConfigPanelProps {
  mobile?: boolean;
}

export function ConfigPanel({ mobile }: ConfigPanelProps) {
  if (mobile) {
    return (
      <>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Configuration</h2>
        <div className="flex flex-col gap-6">
          <McuBoardList />
          <Separator />
          <AddSectionDropdown />
          <Separator />
          <SaveConfigList />
          <PinNameActions />
          <Separator />
          <OutputOptions />
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-card p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Configuration</h2>
      <div className="flex flex-col gap-6">
        <McuBoardList />
        <Separator />
        <AddSectionDropdown />
        <Separator />
        <SaveConfigList />
        <PinNameActions />
        <Separator />
        <OutputOptions />
      </div>
    </div>
  );
}
