"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getJob, generateCommitSummary, getMetricHistory } from "@/lib/api";
import { MetricChart } from "@/components/metric-chart";
import { DiffViewer } from "@/components/diff-viewer";
import type { TrainingJob, CommitSummary, MetricHistory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuthProvider } from "@/components/providers";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  running: "default",
  completed: "outline",
  failed: "destructive",
};

function JobDetailContent() {
  const params = useParams();
  const projectId = params.projectId as string;
  const jobId = params.jobId as string;
  const [job, setJob] = useState<TrainingJob | null>(null);
  const [summary, setSummary] = useState<CommitSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, MetricHistory[]>>({});

  useEffect(() => {
    if (jobId) {
      getJob(jobId).then(setJob);
    }
  }, [jobId]);

  useEffect(() => {
    if (job?.mlflow_run_id) {
      for (const key of ["loss", "accuracy", "val_loss", "val_accuracy"]) {
        getMetricHistory(job.mlflow_run_id, key)
          .then((data) => setMetrics((prev) => ({ ...prev, [key]: data })))
          .catch(() => {});
      }
    }
  }, [job?.mlflow_run_id]);

  const handleGenerateSummary = async () => {
    if (!projectId || !job) return;
    setSummaryLoading(true);
    try {
      const s = await generateCommitSummary(projectId, job.commit_sha);
      setSummary(s);
    } finally {
      setSummaryLoading(false);
    }
  };

  if (!job) return <p className="text-muted-foreground">Loading job...</p>;

  return (
    <div>
      <Link href={`/projects/${projectId}`} className="text-sm text-primary hover:underline inline-block mb-3">
        &larr; Back to project
      </Link>

      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-3xl font-bold">Job: {job.commit_sha.slice(0, 8)}</h2>
        <Badge variant={STATUS_VARIANTS[job.status] ?? "secondary"}>
          {job.status}
        </Badge>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6 space-y-3">
          <div className="text-sm">
            <strong>Branch:</strong> {job.branch}
          </div>
          <div className="text-sm">
            <strong>Commit:</strong> <code className="bg-muted px-1 py-0.5 rounded text-xs">{job.commit_sha}</code>
          </div>
          {job.sagemaker_job_name && (
            <div className="text-sm">
              <strong>SageMaker Job:</strong> {job.sagemaker_job_name}
            </div>
          )}
          {job.started_at && (
            <div className="text-sm">
              <strong>Started:</strong> {new Date(job.started_at).toLocaleString()}
            </div>
          )}
          {job.completed_at && (
            <div className="text-sm">
              <strong>Completed:</strong> {new Date(job.completed_at).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-3">Commit Summary</h3>
        {summary ? (
          <DiffViewer summary={summary.summary} />
        ) : (
          <Button
            onClick={handleGenerateSummary}
            disabled={summaryLoading}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {summaryLoading ? "Generating..." : "Generate Summary"}
          </Button>
        )}
      </section>

      {Object.keys(metrics).length > 0 && (
        <section className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Training Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(metrics).map(([key, data]) =>
              data.length > 0 ? (
                <MetricChart key={key} metricKey={key} data={data} />
              ) : null
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default function JobDetail() {
  return (
    <AuthProvider>
      <JobDetailContent />
    </AuthProvider>
  );
}
