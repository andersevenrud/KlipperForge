import type { AnyReferenceType, CrossReferenceCategory, RelatedArticle } from "@klipperforge/printer-data";
import {
  BookOpen,
  Check,
  CircleDot,
  CircleHelp,
  Cog,
  Combine,
  Cpu,
  Crosshair,
  ExternalLink,
  Fan,
  FileText,
  Flame,
  GitBranch,
  Github,
  Layers,
  Monitor,
  PlugZap,
  Printer,
  Puzzle,
  ShoppingCart,
  Thermometer,
  TriangleAlert,
  X,
} from "lucide-react";
import { type ReactNode, createContext, useContext, useEffect, useRef } from "react";
import { Link } from "react-router";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DocPageShellProps {
  children: ReactNode;
}

interface SpecRowProps {
  icon?: typeof ExternalLink;
  label: string;
  field?: string;
  value?: string | number | null;
  suffix?: string;
  unverified?: boolean;
  children?: ReactNode;
}

interface BooleanSpecRowProps {
  icon?: typeof ExternalLink;
  label: string;
  field?: string;
  value: boolean;
  unverified?: boolean;
}

interface SpecSectionProps {
  title: string;
  icon?: typeof ExternalLink;
  unverified?: string[];
  children: ReactNode;
}

interface ReferenceListProps {
  references?: { label: string; url: string; type: AnyReferenceType }[];
}

interface UnverifiedBannerProps {
  unverified?: string[];
}

interface RelatedArticlesProps {
  articles?: RelatedArticle[];
}

interface FeatureListProps {
  features?: string[];
}

interface BadgeProps {
  children: ReactNode;
}

interface DocHeaderProps {
  name: string;
  manufacturer?: string;
  description?: string;
  badges?: ReactNode;
}

interface SpecSectionContextValue {
  icon?: typeof ExternalLink;
  unverified?: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const CATEGORY_PARAM_KEY: Record<string, string> = {
  accessories: "accessory",
  displays: "display",
  filaments: "filament",
  "mcu-boards": "board",
  printers: "printer",
  probes: "probe",
  "stepper-motors": "motor",
  fans: "fan",
  thermistors: "thermistor",
  extruders: "extruder",
  hotends: "hotend",
  "power-supplies": "psu",
  toolheads: "toolhead",
  mmus: "mmu",
};

export const DOC_CATEGORY_ICONS: Record<CrossReferenceCategory, typeof ExternalLink> = {
  accessories: Puzzle,
  displays: Monitor,
  filaments: Layers,
  "mcu-boards": Cpu,
  "stepper-motors": Cog,
  probes: Crosshair,
  fans: Fan,
  thermistors: Thermometer,
  extruders: CircleDot,
  hotends: Flame,
  "power-supplies": PlugZap,
  toolheads: Combine,
  mmus: GitBranch,
  printers: Printer,
};

export const DOC_CATEGORY_LABELS: Record<CrossReferenceCategory, string> = {
  accessories: "Accessories",
  displays: "Displays",
  filaments: "Filaments",
  "mcu-boards": "MCU Boards",
  "stepper-motors": "Stepper Motors",
  probes: "Probes",
  fans: "Fans",
  thermistors: "Thermistors",
  extruders: "Extruders",
  hotends: "Hotends",
  "power-supplies": "Power Supplies",
  toolheads: "Toolheads",
  mmus: "MMUs",
  printers: "Printers",
};

const REFERENCE_TYPE_ICONS: Record<AnyReferenceType, typeof ExternalLink> = {
  datasheet: FileText,
  product: ShoppingCart,
  github: Github,
  documentation: FileText,
  other: ExternalLink,
  wiki: BookOpen,
  manual: FileText,
  pinout: FileText,
  schematic: FileText,
  dimensions: FileText,
};

const SpecSectionContext = createContext<SpecSectionContextValue>({});

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

export function DocPageShell({ children }: DocPageShellProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(function scrollResetEffect() {
    ref.current?.scrollTo(0, 0);
  });

  return (
    <div ref={ref} className="h-full overflow-y-auto p-6">
      {children}
    </div>
  );
}

export function DocHeader({ name, manufacturer, description, badges }: DocHeaderProps) {
  return (
    <>
      <div className="flex items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold">{name}</h1>
          {manufacturer && <p className="text-muted-foreground mt-1 text-sm">{manufacturer}</p>}
        </div>
        {badges}
      </div>
      {description && <p className="mt-3 text-sm">{description}</p>}
    </>
  );
}

export function Badge({ children }: BadgeProps) {
  return <code className="bg-muted mt-1 shrink-0 rounded px-2 py-0.5 text-xs font-medium">{children}</code>;
}

function UnverifiedBadge() {
  return (
    <span title="Unverified — not confirmed by official sources">
      <CircleHelp className="text-muted-foreground size-3.5" />
    </span>
  );
}

export function UnverifiedBanner({ unverified }: UnverifiedBannerProps) {
  if (!unverified || unverified.length === 0) return null;
  return (
    <div className="mt-4 flex items-start gap-2.5 rounded-md border border-amber-500/20 bg-amber-950/30 px-4 py-3">
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
      <p className="text-sm text-amber-200">
        Some specs marked with <CircleHelp className="inline size-3" /> could not be verified from official sources.
      </p>
    </div>
  );
}

export function SpecSection({ title, icon, unverified, children }: SpecSectionProps) {
  return (
    <SpecSectionContext.Provider value={{ icon, unverified }}>
      <div className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">{title}</h2>
        <div className="space-y-2">{children}</div>
      </div>
    </SpecSectionContext.Provider>
  );
}

export function SpecRow({ icon, label, field, value, suffix, unverified, children }: SpecRowProps) {
  const ctx = useContext(SpecSectionContext);
  const Icon = icon ?? ctx.icon;
  const isUnverified = unverified ?? (field && ctx.unverified ? ctx.unverified.includes(field) : false);
  if (value === undefined || value === null) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      {Icon && <Icon className="text-muted-foreground size-4" />}
      <span className="font-medium">{label}:</span>
      {children ?? (
        <span>
          {value}
          {suffix}
        </span>
      )}
      {isUnverified && <UnverifiedBadge />}
    </div>
  );
}

export function BooleanSpecRow({ icon, label, field, value, unverified }: BooleanSpecRowProps) {
  const ctx = useContext(SpecSectionContext);
  const Icon = icon ?? ctx.icon;
  const isUnverified = unverified ?? (field && ctx.unverified ? ctx.unverified.includes(field) : false);
  return (
    <div className="flex items-center gap-2 text-sm">
      {Icon && <Icon className="text-muted-foreground size-4" />}
      <span className="font-medium">{label}:</span>
      {value ? <Check className="size-4 text-green-600" /> : <X className="size-4 text-red-500" />}
      {isUnverified && <UnverifiedBadge />}
    </div>
  );
}

export function ReferenceList({ references }: ReferenceListProps) {
  if (!references || references.length === 0) return null;
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-lg font-semibold">References</h2>
      <ul className="space-y-1">
        {references.map((ref) => {
          const Icon = REFERENCE_TYPE_ICONS[ref.type];
          return (
            <li key={ref.url}>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 inline-flex items-center gap-2 text-sm underline-offset-4 hover:underline"
              >
                <Icon className="size-4 shrink-0" />
                {ref.label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (!articles || articles.length === 0) return null;

  const grouped = new Map<string, RelatedArticle[]>();
  for (const article of articles) {
    const existing = grouped.get(article.category);
    if (existing) {
      existing.push(article);
    } else {
      grouped.set(article.category, [article]);
    }
  }

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-lg font-semibold">Related Articles</h2>
      <div className="space-y-3">
        {Array.from(grouped.entries()).map(([category, entries]) => {
          const CategoryIcon = DOC_CATEGORY_ICONS[category as CrossReferenceCategory];
          const categoryLabel = DOC_CATEGORY_LABELS[category as CrossReferenceCategory];
          const paramKey = CATEGORY_PARAM_KEY[category];
          return (
            <div key={category}>
              <h3 className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
                {CategoryIcon && <CategoryIcon className="size-3.5" />}
                {categoryLabel ?? category}
              </h3>
              <ul className="space-y-0.5">
                {entries.map((entry) => (
                  <li key={`${entry.category}-${entry.id}`} className="text-sm">
                    {paramKey ? (
                      <Link
                        to={`/documentation?${paramKey}=${entry.id}`}
                        className="text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                      >
                        {entry.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">{entry.name}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FeatureList({ features }: FeatureListProps) {
  if (!features || features.length === 0) return null;
  return (
    <div className="mt-6">
      <h2 className="mb-2 text-lg font-semibold">Features</h2>
      <ul className="list-inside list-disc space-y-1 text-sm">
        {features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </div>
  );
}
