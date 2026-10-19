import { useEffect, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * For a custom dialog: moves focus inside while it's open, keeps Tab cycling
 * within it, and hands focus back to whatever opened it when it closes.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, open: boolean) {
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const items = () => Array.from(root?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const first = requestAnimationFrame(() => items()[0]?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const list = items();
      if (!list.length) return;
      const [a, z] = [list[0], list[list.length - 1]];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(first);
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [ref, open]);
}
