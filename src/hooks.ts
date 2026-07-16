import { useEffect, useState } from "preact/hooks";
import { q } from "./data/db";

/** Run a query when `sql` changes; tables auto-register lazily in q(). */
export function useQuery<T = Record<string, unknown>>(sql: string | null) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!sql) return;
    let live = true;
    setBusy(true);
    Promise.resolve()
      .then(() => q<T>(sql))
      .then((r) => live && (setRows(r), setBusy(false)))
      .catch((e) => live && (console.error(e), setBusy(false)));
    return () => {
      live = false;
    };
  }, [sql]);
  return { rows, busy };
}

export const fmtB = (v: number) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + "B";
export const fmtM = (v: number) =>
  v >= 1000 ? "$" + (v / 1000).toFixed(1) + "B" : "$" + (v >= 10 ? v.toFixed(0) : v.toFixed(1)) + "M";

export function linePath(xs: number[], ys: number[]): string {
  return xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)} ${ys[i].toFixed(1)}`).join(" ");
}

/** IntersectionObserver reveal hook: returns ref-setter + visible flag. */
export function useReveal(): [(el: HTMLElement | null) => void, boolean] {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setOn(true)),
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [el]);
  return [setEl, on];
}
