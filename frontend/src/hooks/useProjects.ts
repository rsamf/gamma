"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { listProjects } from "@/lib/api";

export function useProjects(ownerId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listProjects(ownerId)
      .then(setProjects)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [ownerId]);

  return { projects, loading, error, refetch: () => listProjects(ownerId).then(setProjects) };
}
