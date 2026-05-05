import { useEffect, useState } from "react";
import type { BoardFilters } from "@/hooks/use-task-filters";

export type SavedView = {
  id: string;
  name: string;
  filters: BoardFilters;
  createdAt: number;
};

function getStorageKey(projectId: string) {
  return `kaneo:saved-views:${projectId}`;
}

function loadViews(projectId: string): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedView[];
  } catch {
    return [];
  }
}

function persistViews(projectId: string, views: SavedView[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(projectId), JSON.stringify(views));
}

export function useSavedViews(projectId: string) {
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);

  useEffect(() => {
    setSavedViews(loadViews(projectId));
  }, [projectId]);

  const saveView = (name: string, filters: BoardFilters) => {
    const newView: SavedView = {
      id: crypto.randomUUID(),
      name: name.trim(),
      filters,
      createdAt: Date.now(),
    };
    setSavedViews((prev) => {
      const updated = [...prev, newView];
      persistViews(projectId, updated);
      return updated;
    });
  };

  const deleteView = (id: string) => {
    setSavedViews((prev) => {
      const updated = prev.filter((v) => v.id !== id);
      persistViews(projectId, updated);
      return updated;
    });
  };

  return { savedViews, saveView, deleteView };
}
