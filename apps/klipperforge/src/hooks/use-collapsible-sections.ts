import { useConfig } from "@/context/config-context";
import { useEditorScroll } from "@klipperforge/editor";
import { useCallback, useEffect, useState } from "react";

interface UseCollapsibleSectionsOptions {
  filterScrollTarget?: (header: string) => boolean;
}

export function useCollapsibleSections(options?: UseCollapsibleSectionsOptions) {
  const { state } = useConfig();
  const { scrollToSection, formScrollTarget, clearFormScrollTarget } = useEditorScroll();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = useCallback(
    (key: string, forceOpen?: boolean) => {
      setExpandedSections((prev) => {
        const next = new Set(prev);
        const shouldOpen = forceOpen ?? !next.has(key);
        if (shouldOpen) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
      scrollToSection(key);
    },
    [scrollToSection],
  );

  const expandSection = useCallback((key: string) => {
    setExpandedSections((prev) => new Set(prev).add(key));
  }, []);

  // Collapse all sections when config is replaced (import/reset/preset)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional trigger on epoch change
  useEffect(
    function collapseOnConfigReplaceEffect() {
      setExpandedSections(new Set());
    },
    [state.configEpoch],
  );

  // React to editor → form navigation requests
  useEffect(
    function handleFormScrollTargetEffect() {
      if (!formScrollTarget) return;
      const { header, field } = formScrollTarget;

      if (options?.filterScrollTarget && !options.filterScrollTarget(header)) return;

      setExpandedSections((prev) => new Set(prev).add(header));

      const fieldSelector = field ? `[data-field-id="${CSS.escape(`${header}-${field}`)}"]` : null;
      const sectionSelector = `[data-section-header="${CSS.escape(header)}"]`;

      function scrollToElement(el: HTMLElement) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        el.classList.remove("field-flash");
        void el.offsetWidth;
        el.classList.add("field-flash");
      }

      function tryScroll(attempt: number) {
        const el = ((fieldSelector && document.querySelector(fieldSelector)) ||
          document.querySelector(sectionSelector)) as HTMLElement | null;
        if (el) {
          // If we found the section header but a field was requested, retry
          // to give CollapsibleContent time to render the field element
          if (fieldSelector && !document.querySelector(fieldSelector) && attempt < 3) {
            scrollToElement(el);
            requestAnimationFrame(() => tryScroll(attempt + 1));
            return;
          }
          scrollToElement(el);
        }
      }

      requestAnimationFrame(() => tryScroll(0));

      clearFormScrollTarget();
    },
    [formScrollTarget, clearFormScrollTarget, options?.filterScrollTarget],
  );

  return { expandedSections, toggleSection, expandSection, scrollToSection };
}
