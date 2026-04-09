import type { ReactNode } from "react";
import { useState } from "react";
import { FieldWrapper } from "@/components/ui/field-wrapper";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface NumberField {
  type: "number";
  key: string;
  label: string;
  default: number;
  step?: number;
  hint?: string;
  measured?: boolean;
}

interface SelectOption {
  label: string;
  value: string;
}

interface SelectField {
  type: "select";
  key: string;
  label: string;
  default: string;
  options: SelectOption[];
  hint?: string;
  measured?: boolean;
}

type CalculatorField = NumberField | SelectField;

interface GuideCalculatorProps {
  title: string;
  fields: CalculatorField[];
  calculate: (values: Record<string, number | string>) => number;
  decimalPlaces: number;
  unit?: string;
}

interface GuideLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

interface GuideStepProps {
  step: number;
  title: string;
  children: ReactNode;
}

interface GuideSubStepProps {
  title: string;
  children: ReactNode;
}

interface GuideCodeProps {
  children: string;
}

interface GuideNotesProps {
  items: string[];
}

export function GuideLayout({ title, subtitle, children }: GuideLayoutProps) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-1">{subtitle}</p>
      {children}
    </div>
  );
}

export function GuideStep({ step, title, children }: GuideStepProps) {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">
        {step}. {title}
      </h2>
      {children}
    </>
  );
}

export function GuideSubStep({ title, children }: GuideSubStepProps) {
  return (
    <>
      <h3 className="mt-4 text-base font-medium">{title}</h3>
      {children}
    </>
  );
}

export function GuideSection({ title, children }: GuideSubStepProps) {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">{title}</h2>
      {children}
    </>
  );
}

export function GuideText({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm">{children}</p>;
}

export function GuideCode({ children }: GuideCodeProps) {
  return (
    <pre className="bg-muted mt-2 rounded-md p-3 text-sm">
      <code>{children}</code>
    </pre>
  );
}

export function GuideNotes({ items }: GuideNotesProps) {
  return (
    <ul className="mt-1 list-disc pl-5 text-sm">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

interface GuideFootnote {
  label: string;
  url: string;
}

interface GuideFootnotesProps {
  items: GuideFootnote[];
}

export function GuideFootnotes({ items }: GuideFootnotesProps) {
  return (
    <ol className="mt-6 list-decimal pl-5 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.url}>
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline">
            {item.label}
          </a>
        </li>
      ))}
    </ol>
  );
}

export function GuideCalculator({ title, fields, calculate, decimalPlaces, unit }: GuideCalculatorProps) {
  const [values, setValues] = useState<Record<string, number | string>>(() => {
    const initial: Record<string, number | string> = {};
    for (const field of fields) {
      initial[field.key] = field.default;
    }
    return initial;
  });

  const [rawInputs, setRawInputs] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      if (field.type === "number") {
        initial[field.key] = String(field.default);
      }
    }
    return initial;
  });

  const handleChange = (key: string, raw: string, type: "number" | "select") => {
    if (type === "number") {
      setRawInputs((prev) => ({ ...prev, [key]: raw }));
      const parsed = Number.parseFloat(raw);
      setValues((prev) => ({ ...prev, [key]: Number.isNaN(parsed) ? 0 : parsed }));
    } else {
      setValues((prev) => ({ ...prev, [key]: raw }));
    }
  };

  const result = calculate(values);

  return (
    <div className="mt-4 rounded-md border border-border p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <FieldWrapper name={field.label}>
              {({ id }) => (
                <>
                  {field.hint && <p className="text-muted-foreground text-xs">{field.hint}</p>}
                  {field.type === "number" ? (
                    <Input
                      id={id}
                      type="number"
                      step={field.step}
                      className={field.measured ? "border-sky-400/50 bg-sky-50 dark:bg-sky-950/30" : ""}
                      value={rawInputs[field.key] ?? values[field.key]}
                      onChange={(e) => handleChange(field.key, e.target.value, "number")}
                    />
                  ) : (
                    <Select
                      value={values[field.key] as string}
                      onValueChange={(v) => handleChange(field.key, v, "select")}
                    >
                      <SelectTrigger
                        id={id}
                        className={`w-full ${field.measured ? "border-sky-400/50 bg-sky-50 dark:bg-sky-950/30" : ""}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}
            </FieldWrapper>
          </div>
        ))}
      </div>
      <div className="mt-3 text-sm">
        Result:{" "}
        <span className="font-mono font-semibold">
          {result.toFixed(decimalPlaces)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
    </div>
  );
}
