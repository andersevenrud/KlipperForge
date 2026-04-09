import { useEffect, useRef } from "react";

interface BuildLogProps {
  lines: string[];
}

export function BuildLog({ lines }: BuildLogProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when lines prop changes
  useEffect(
    function scrollToBottomEffect() {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    },
    [lines],
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Build output</p>
      <div
        ref={containerRef}
        className="max-h-64 overflow-y-auto rounded-md border border-border bg-black/90 p-3 font-mono text-xs leading-relaxed text-green-400"
      >
        {lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}
