"use client";

import Link from "next/link";
import type { TrainingJob } from "@/lib/types";
import { Badge } from "./ui/badge";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  running: "default",
  completed: "outline",
  failed: "destructive",
};

interface Props {
  jobs: TrainingJob[];
  projectId: string;
}

export function JobTable({ jobs, projectId }: Props) {
  if (jobs.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No training jobs yet. Push to a models branch to trigger one.</p>;
  }

  return (
    <div className="rounded-lg border bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-4 text-sm font-semibold">Commit</th>
            <th className="text-left p-4 text-sm font-semibold">Branch</th>
            <th className="text-left p-4 text-sm font-semibold">Status</th>
            <th className="text-left p-4 text-sm font-semibold">Created</th>
            <th className="text-left p-4 text-sm font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b last:border-0">
              <td className="p-4 text-sm">
                <code className="bg-muted px-1 py-0.5 rounded text-xs">{job.commit_sha.slice(0, 8)}</code>
              </td>
              <td className="p-4 text-sm">{job.branch}</td>
              <td className="p-4 text-sm">
                <Badge variant={STATUS_VARIANTS[job.status] ?? "secondary"}>
                  {job.status}
                </Badge>
              </td>
              <td className="p-4 text-sm text-muted-foreground">{new Date(job.created_at).toLocaleString()}</td>
              <td className="p-4 text-sm">
                <Link href={`/projects/${projectId}/jobs/${job.id}`} className="text-primary hover:underline text-sm">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
