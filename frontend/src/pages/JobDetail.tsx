import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getJob, generateCommitSummary, getMetricHistory } from "../services/api";
import MetricChart from "../components/MetricChart";
import DiffViewer from "../components/DiffViewer";
import type { TrainingJob, CommitSummary, MetricHistory } from "../types";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  running: "#3b82f6",
  completed: "#10b981",
  failed: "#ef4444",
};

function JobDetail() {
  const { projectId, jobId } = useParams<{ projectId: string; jobId: string }>();
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
      // Fetch common metrics
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

  if (!job) return <p>Loading job...</p>;

  return (
    <div>
      <Link to={`/projects/${projectId}`} style={styles.backLink}>
        &larr; Back to project
      </Link>

      <div style={styles.header}>
        <h2>Job: {job.commit_sha.slice(0, 8)}</h2>
        <span style={{ ...styles.badge, background: STATUS_COLORS[job.status] }}>
          {job.status}
        </span>
      </div>

      <div style={styles.details}>
        <div style={styles.detailRow}>
          <strong>Branch:</strong> {job.branch}
        </div>
        <div style={styles.detailRow}>
          <strong>Commit:</strong> <code>{job.commit_sha}</code>
        </div>
        {job.sagemaker_job_name && (
          <div style={styles.detailRow}>
            <strong>SageMaker Job:</strong> {job.sagemaker_job_name}
          </div>
        )}
        {job.started_at && (
          <div style={styles.detailRow}>
            <strong>Started:</strong> {new Date(job.started_at).toLocaleString()}
          </div>
        )}
        {job.completed_at && (
          <div style={styles.detailRow}>
            <strong>Completed:</strong> {new Date(job.completed_at).toLocaleString()}
          </div>
        )}
      </div>

      <section style={styles.section}>
        <h3>Commit Summary</h3>
        {summary ? (
          <DiffViewer summary={summary.summary} />
        ) : (
          <button style={styles.summaryBtn} onClick={handleGenerateSummary} disabled={summaryLoading}>
            {summaryLoading ? "Generating..." : "Generate Summary"}
          </button>
        )}
      </section>

      {Object.keys(metrics).length > 0 && (
        <section style={styles.section}>
          <h3>Training Metrics</h3>
          <div style={styles.chartsGrid}>
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

const styles: Record<string, React.CSSProperties> = {
  backLink: { fontSize: 14, color: "#0066ff", textDecoration: "none" },
  header: { display: "flex", alignItems: "center", gap: 12, margin: "12px 0 20px" },
  badge: { padding: "4px 12px", borderRadius: 12, color: "#fff", fontSize: 13, fontWeight: 600 },
  details: { background: "#fff", padding: 20, borderRadius: 8, border: "1px solid #e0e0e0", marginBottom: 24 },
  detailRow: { padding: "6px 0", fontSize: 14 },
  section: { marginBottom: 24 },
  summaryBtn: { padding: "8px 16px", fontSize: 14, background: "#7c3aed", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  chartsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 16 },
};

export default JobDetail;
