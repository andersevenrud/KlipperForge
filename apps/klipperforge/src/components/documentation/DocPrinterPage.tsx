import { useDocDataQuery } from "@/hooks/use-queries";
import type { PrinterEquipmentCategory, PrinterEquipmentEntry } from "@klipperforge/printer-data";
import { loadPrinterPreset } from "@klipperforge/printer-data";
import { Box, Package, Ruler } from "lucide-react";
import { Link } from "react-router";
import {
  CATEGORY_PARAM_KEY,
  DOC_CATEGORY_ICONS,
  DOC_CATEGORY_LABELS,
  DocPageShell,
  ReferenceList,
  SpecRow,
} from "./doc-shared";

interface DocPrinterPageProps {
  printerId: string;
}

export function DocPrinterPage({ printerId }: DocPrinterPageProps) {
  const printer = useDocDataQuery(loadPrinterPreset, printerId);

  return (
    <DocPageShell>
      <h1 className="text-2xl font-bold">{printer.name}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{printer.manufacturer}</p>

      {printer.description && <p className="mt-3 text-sm">{printer.description}</p>}

      {printer.kinematics && (
        <div className="mt-4">
          <SpecRow icon={Box} label="Kinematics" value={printer.kinematics}>
            <code className="bg-muted rounded px-1.5 py-0.5">{printer.kinematics}</code>
          </SpecRow>
        </div>
      )}

      {printer.bedSize && (
        <div className="mt-2">
          <SpecRow
            icon={Ruler}
            label="Bed Size"
            value={`${printer.bedSize.x} × ${printer.bedSize.y} × ${printer.bedSize.z} mm`}
          />
        </div>
      )}

      {printer.variants && printer.variants.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-lg font-semibold">Variants</h2>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Kinematics</th>
                  <th className="px-3 py-2 text-left font-medium">Bed Size</th>
                </tr>
              </thead>
              <tbody>
                {printer.variants.map((variant) => (
                  <tr key={variant.id} className="border-b last:border-0">
                    <td className="px-3 py-1.5">{variant.name}</td>
                    <td className="px-3 py-1.5">
                      <code className="bg-muted rounded px-1.5 py-0.5">{variant.kinematics}</code>
                    </td>
                    <td className="px-3 py-1.5">
                      {variant.bedSize.x} × {variant.bedSize.y} × {variant.bedSize.z} mm
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EquipmentList equipment={printer.equipment} />

      <ReferenceList references={printer.references} />
    </DocPageShell>
  );
}

interface EquipmentListProps {
  equipment?: PrinterEquipmentEntry[];
}

function EquipmentList({ equipment }: EquipmentListProps) {
  if (!equipment || equipment.length === 0) return null;

  const grouped = new Map<PrinterEquipmentCategory, PrinterEquipmentEntry[]>();
  for (const entry of equipment) {
    const existing = grouped.get(entry.category);
    if (existing) {
      existing.push(entry);
    } else {
      grouped.set(entry.category, [entry]);
    }
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Package className="size-5" />
        Installed Equipment
      </h2>
      <div className="space-y-3">
        {Array.from(grouped.entries()).map(([category, entries]) => {
          const CategoryIcon = DOC_CATEGORY_ICONS[category];
          const categoryLabel = DOC_CATEGORY_LABELS[category];
          return (
            <div key={category}>
              <h3 className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                <CategoryIcon className="size-3.5" />
                {categoryLabel}
              </h3>
              <ul className="space-y-0.5">
                {entries.map((entry, i) => {
                  const paramKey = CATEGORY_PARAM_KEY[entry.category];
                  return (
                    <li
                      key={`${entry.category}-${entry.id ?? entry.label}-${i}`}
                      className="flex items-center gap-2 text-sm"
                    >
                      {entry.id && paramKey ? (
                        <Link
                          to={`/documentation?${paramKey}=${entry.id}`}
                          className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                        >
                          {entry.label}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{entry.label}</span>
                      )}
                      {entry.role && <span className="text-muted-foreground text-xs">— {entry.role}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
