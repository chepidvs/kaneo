import { useEffect, useState } from "react";

function getStorageKey(workspaceId: string) {
  return `kaneo:pinned-projects:${workspaceId}`;
}

export function usePinnedProjects(workspaceId: string) {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined" || !workspaceId) return;
    try {
      const raw = window.localStorage.getItem(getStorageKey(workspaceId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        setPinnedIds(parsed.filter((v): v is string => typeof v === "string"));
      }
    } catch {
      // ignore
    }
  }, [workspaceId]);

  const persist = (ids: string[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      getStorageKey(workspaceId),
      JSON.stringify(ids),
    );
  };

  const togglePin = (projectId: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId];
      persist(next);
      return next;
    });
  };

  const isPinned = (projectId: string) => pinnedIds.includes(projectId);

  return { pinnedIds, togglePin, isPinned };
}
