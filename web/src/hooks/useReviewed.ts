import { useCallback, useEffect, useState } from 'react';

/** Tracks which findings a scheduler has checked off, persisted locally so a reload doesn't lose progress. */
export function useReviewed(storageKey: string) {
  const [reviewed, setReviewed] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(reviewed));
    } catch {
    }
  }, [storageKey, reviewed]);

  const toggle = useCallback((id: string, checked: boolean) => {
    setReviewed((prev) => {
      const next = { ...prev };
      if (checked) next[id] = true;
      else delete next[id];
      return next;
    });
  }, []);

  return { reviewed, toggle };
}
