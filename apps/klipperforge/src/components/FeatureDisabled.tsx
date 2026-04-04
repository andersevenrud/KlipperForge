import type { ReactNode } from "react";

interface FeatureDisabledProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function FeatureDisabled({ icon, title, description }: FeatureDisabledProps) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="text-muted-foreground">{icon}</div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}
