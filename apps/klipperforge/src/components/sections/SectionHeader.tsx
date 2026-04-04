import { FieldWrapper } from "@/components/ui/field-wrapper";
import type { ReactNode } from "react";

interface SectionHeaderProps {
  label: string;
  children?: ReactNode;
}

export function SectionHeader({ label, children }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <FieldWrapper name={label}>{() => null}</FieldWrapper>
      {children}
    </div>
  );
}
