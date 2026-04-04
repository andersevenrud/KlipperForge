import { Button } from "@/components/ui/button";
import { useDocDataMultipleQuery } from "@/hooks/use-queries";
import { ArrowLeft, Check, X } from "lucide-react";
import type { DocCategory } from "./DocumentationView";
import { COMPARISON_CONFIGS } from "./comparison-specs";
import type { ComparisonCategoryConfig } from "./comparison-specs";
import { DOC_CATEGORY_LABELS } from "./doc-shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocComparisonViewProps {
  category: DocCategory;
  itemIds: string[];
  onExit: () => void;
  onRemoveItem: (itemId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatValue(
  value: string | number | boolean | null | undefined,
  row: { suffix?: string; format?: "boolean" },
): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">&mdash;</span>;
  }
  if (row.format === "boolean") {
    return typeof value === "boolean" && value ? (
      <Check className="size-4 text-green-600" />
    ) : (
      <X className="size-4 text-red-500" />
    );
  }
  return (
    <span>
      {String(value)}
      {row.suffix}
    </span>
  );
}

function hasRowDifference(values: (string | number | boolean | null | undefined)[]): boolean {
  const defined = values.filter((v) => v !== null && v !== undefined);
  if (defined.length <= 1) return false;
  return defined.some((v) => String(v) !== String(defined[0]));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocComparisonView({ category, itemIds, onExit, onRemoveItem }: DocComparisonViewProps) {
  const config = COMPARISON_CONFIGS[category] as ComparisonCategoryConfig | undefined;

  if (!config) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground text-sm">Comparison is not available for this category.</p>
      </div>
    );
  }

  return (
    <ComparisonTable
      config={config}
      category={category}
      itemIds={itemIds}
      onExit={onExit}
      onRemoveItem={onRemoveItem}
    />
  );
}

// ---------------------------------------------------------------------------
// Inner table (needs hooks, so separate component)
// ---------------------------------------------------------------------------

interface ComparisonTableProps {
  config: ComparisonCategoryConfig;
  category: DocCategory;
  itemIds: string[];
  onExit: () => void;
  onRemoveItem: (itemId: string) => void;
}

function ComparisonTable({ config, category, itemIds, onExit, onRemoveItem }: ComparisonTableProps) {
  const items = useDocDataMultipleQuery(config.loader, itemIds);

  const loadedItems = items as Record<string, unknown>[];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-6 py-3">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ArrowLeft className="mr-1.5 size-4" />
          Exit comparison
        </Button>
        <h1 className="text-lg font-semibold">
          Compare {DOC_CATEGORY_LABELS[category as keyof typeof DOC_CATEGORY_LABELS] ?? category}
        </h1>
        <span className="text-muted-foreground text-sm">{itemIds.length} items</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="bg-background sticky left-0 z-10 min-w-[120px] border-r px-4 py-2 text-left font-medium md:min-w-[180px]" />
              {itemIds.map((id, i) => {
                const item = loadedItems[i];
                const name = item ? config.nameAccessor(item) : id;
                return (
                  <th key={id} className="min-w-[120px] px-4 py-2 text-left font-medium md:min-w-[160px]">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate">{name}</span>
                      {itemIds.length > 2 && (
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground shrink-0 rounded p-0.5 hover:bg-accent"
                          onClick={() => onRemoveItem(id)}
                          title="Remove from comparison"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {config.sections.map((section) => (
              <>
                <tr key={`section-${section.title}`}>
                  <td
                    colSpan={itemIds.length + 1}
                    className="bg-muted/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide"
                  >
                    {section.title}
                  </td>
                </tr>
                {section.rows.map((row) => {
                  const values = loadedItems.map((item) => (item ? row.accessor(item) : undefined));
                  const differs = hasRowDifference(values);
                  return (
                    <tr
                      key={`row-${section.title}-${row.label}`}
                      className={`border-b ${differs ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}`}
                    >
                      <td className="bg-background sticky left-0 z-10 border-r px-4 py-1.5 font-medium">{row.label}</td>
                      {values.map((value, i) => (
                        <td key={itemIds[i]} className="px-4 py-1.5">
                          {formatValue(value, row)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
