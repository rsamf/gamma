"use client";

import { useEffect, useState } from "react";
import type { TrainingJob } from "@/lib/types";
import { listJobs } from "@/lib/api";

export function useJobs(projectId: string) {
  const [jobs, setJobs] = useState<TrainingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listJobs(projectId)
      .then(setJobs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  return { jobs, loading, error, refetch: () => listJobs(projectId).then(setJobs) };
}
