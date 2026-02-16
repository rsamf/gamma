"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getProject, listRuns, getMetricHistory } from "@/lib/api";
import { MetricChart } from "@/components/metric-chart";
import type { Project, MLflowRun, MetricHistory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AuthProvider } from "@/components/providers";

function ExperimentsContent() {
  const params = useParams();
  const projectId = params.projectId as string;
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

  if (!project) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <Link href={`/projects/${projectId}`} className="text-sm text-primary hover:underline inline-block mb-3">
        &larr; Back to project
      </Link>
      <h2 className="text-3xl font-bold mb-5">Experiments</h2>

      <div className="flex gap-3 mb-5">
        <Input
          placeholder="Metric key (e.g. loss)"
          value={metricKey}
          onChange={(e) => setMetricKey(e.target.value)}
          className="w-64"
        />
        <Button onClick={handleCompare} disabled={selectedRuns.length === 0}>
          Compare ({selectedRuns.length} runs)
        </Button>
      </div>

      <div className="flex gap-6">
        <Card className="flex-none w-72">
          <CardContent className="pt-6">
            <h4 className="font-semibold mb-3">Runs</h4>
            {runs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No runs found.</p>
            ) : (
              <div className="space-y-2">
                {runs.map((run) => (
                  <label key={run.info.run_id} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedRuns.includes(run.info.run_id)}
                      onChange={() => toggleRun(run.info.run_id)}
                      className="rounded"
                    />
                    <span className="font-mono">{run.info.run_id.slice(0, 8)}</span>
                    <span className="text-xs text-muted-foreground">{run.info.status}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex-1">
          {Object.entries(chartData).map(([runId, data]) =>
            data.length > 0 ? (
              <MetricChart key={runId} metricKey={`${metricKey} (${runId.slice(0, 8)})`} data={data} />
            ) : null
          )}
          {Object.keys(chartData).length === 0 && (
            <p className="text-sm text-muted-foreground">Select runs and click Compare to view metrics.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Experiments() {
  return (
    <AuthProvider>
      <ExperimentsContent />
    </AuthProvider>
  );
}
