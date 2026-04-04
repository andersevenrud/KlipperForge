import { PcbBoardViewer } from "@/components/svg/pcb/PcbBoardViewer";

export function IllustrationPanel() {
  return (
    <div className="flex h-full items-center justify-center overflow-hidden bg-zinc-900/50 p-4">
      <PcbBoardViewer />
    </div>
  );
}
