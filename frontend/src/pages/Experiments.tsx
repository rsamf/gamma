import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getProject, listRuns, getMetricHistory } from "../services/api";
import MetricChart from "../components/MetricChart";
import type { Project, MLflowRun, MetricHistory } from "../types";

function Experiments() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [runs, setRuns] = useState<MLflowRun[]>([]);
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);
  const [metricKey, setMetricKey] = useState("loss");
  const [chartData, setChartData] = useState<Record<string, MetricHistory[]>>({});

  useEffect(() => {
    if (projectId) {
      getProject(projectId).then((p) => {
        setProject(p);
        if (p.mlflow_experiment_name) {
          listRuns(p.mlflow_experiment_name).then(setRuns);
        }
      });
    }
  }, [projectId]);

  const handleCompare = async () => {
    const data: Record<string, MetricHistory[]> = {};
    for (const runId of selectedRuns) {
      try {
        data[runId] = await getMetricHistory(runId, metricKey);
      } catch {
        data[runId] = [];
      }
    }
    setChartData(data);
  };

  const toggleRun = (runId: string) => {
    setSelectedRuns((prev) =>
      prev.includes(runId) ? prev.filter((r) => r !== runId) : [...prev, runId]
    );
  };

  if (!project) return <p>Loading...</p>;

  return (
    <div>
      <Link to={`/projects/${projectId}`} style={styles.backLink}>
        &larr; Back to project
      </Link>
      <h2 style={styles.title}>Experiments</h2>

      <div style={styles.controls}>
        <input
          style={styles.input}
          placeholder="Metric key (e.g. loss)"
          value={metricKey}
          onChange={(e) => setMetricKey(e.target.value)}
        />
        <button style={styles.compareBtn} onClick={handleCompare} disabled={selectedRuns.length === 0}>
          Compare ({selectedRuns.length} runs)
        </button>
      </div>

      <div style={styles.layout}>
        <div style={styles.runList}>
          <h4>Runs</h4>
          {runs.length === 0 ? (
            <p style={styles.empty}>No runs found.</p>
          ) : (
            runs.map((run) => (
              <label key={run.info.run_id} style={styles.runItem}>
                <input
                  type="checkbox"
                  checked={selectedRuns.includes(run.info.run_id)}
                  onChange={() => toggleRun(run.info.run_id)}
                />
                <span style={styles.runId}>{run.info.run_id.slice(0, 8)}</span>
                <span style={styles.runStatus}>{run.info.status}</span>
              </label>
            ))
          )}
        </div>

        <div style={styles.chartArea}>
          {Object.entries(chartData).map(([runId, data]) =>
            data.length > 0 ? (
              <MetricChart key={runId} metricKey={`${metricKey} (${runId.slice(0, 8)})`} data={data} />
            ) : null
          )}
          {Object.keys(chartData).length === 0 && (
            <p style={styles.empty}>Select runs and click Compare to view metrics.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backLink: { fontSize: 14, color: "#0066ff", textDecoration: "none" },
  title: { fontSize: 24, margin: "12px 0 20px" },
  controls: { display: "flex", gap: 12, marginBottom: 20 },
  input: { padding: "8px 12px", fontSize: 14, border: "1px solid #ddd", borderRadius: 6, width: 200 },
  compareBtn: { padding: "8px 16px", fontSize: 14, background: "#0066ff", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" },
  layout: { display: "flex", gap: 24 },
  runList: { flex: "0 0 280px", background: "#fff", padding: 16, borderRadius: 8, border: "1px solid #e0e0e0" },
  runItem: { display: "flex", alignItems: "center", gap: 8, padding: "6px 0", cursor: "pointer", fontSize: 14 },
  runId: { fontFamily: "monospace" },
  runStatus: { fontSize: 12, color: "#888" },
  chartArea: { flex: 1 },
  empty: { color: "#888", fontSize: 14 },
};

export default Experiments;
