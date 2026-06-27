"use client";

import { useCallback, useState } from "react";

/** Copy-to-clipboard with a transient "copied" flag. */
export function useCopy(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.setTimeout(() => setCopied(false), timeout);
        return true;
      } catch {
        // Fallback for older browsers / non-secure contexts
        try {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          setCopied(true);
          window.setTimeout(() => setCopied(false), timeout);
          return true;
        } catch {
          return false;
        }
      }
    },
    [timeout]
  );

  return { copied, copy };
}
