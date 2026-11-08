"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TopBar } from "./Loader";

/**
 * Shows the top loading bar as soon as an internal link is clicked,
 * and hides it when the new page is displayed.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [lastUrl, setLastUrl] = useState(`${pathname}?${searchParams}`);

  // New URL rendered: navigation finished (state update during render, no effect needed).
  const url = `${pathname}?${searchParams}`;
  if (url !== lastUrl) {
    setLastUrl(url);
    setLoading(false);
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element).closest("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const next = new URL(link.href, window.location.href);
      if (next.origin !== window.location.origin) return;
      if (next.pathname + next.search === window.location.pathname + window.location.search) return;
      setLoading(true);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return loading ? <TopBar /> : null;
}
