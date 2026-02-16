import type {
  Project,
  ProjectCreate,
  TrainingJob,
  CommitSummary,
  AgentConversation,
  AgentMessage,
  S3Artifact,
  MLflowRun,
  MetricHistory,
} from "./types";

const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "Request failed");
  }
  return res.json();
}

// Projects
export const listProjects = (ownerId?: string) =>
  request<Project[]>(`/projects${ownerId ? `?owner_id=${ownerId}` : ""}`);

export const getProject = (id: string) => request<Project>(`/projects/${id}`);

export const createProject = (data: ProjectCreate, ownerId: string) =>
  request<Project>(`/projects?owner_id=${ownerId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateProject = (id: string, data: Partial<Project>) =>
  request<Project>(`/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteProject = (id: string) =>
  request<void>(`/projects/${id}`, { method: "DELETE" });

// Training Jobs
export const listJobs = (projectId?: string) =>
  request<TrainingJob[]>(`/jobs${projectId ? `?project_id=${projectId}` : ""}`);

export const getJob = (id: string) => request<TrainingJob>(`/jobs/${id}`);

// Experiments (MLflow proxy)
export const listExperiments = () => request<unknown[]>("/experiments");

export const listRuns = (experimentName: string, maxResults = 100) =>
  request<MLflowRun[]>(
    `/experiments/${encodeURIComponent(experimentName)}/runs?max_results=${maxResults}`
  );

export const getRun = (runId: string) =>
  request<MLflowRun>(`/experiments/runs/${runId}`);

export const getMetricHistory = (runId: string, metricKey: string) =>
  request<MetricHistory[]>(
    `/experiments/runs/${runId}/metrics/${encodeURIComponent(metricKey)}`
  );

// Artifacts
export const listArtifacts = (projectId: string, prefix = "") =>
  request<S3Artifact[]>(
    `/artifacts/${projectId}${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""}`
  );

export const getDownloadUrl = (projectId: string, key: string) =>
  request<{ url: string }>(
    `/artifacts/${projectId}/download-url?key=${encodeURIComponent(key)}`
  );

// Agent
export const generateCommitSummary = (projectId: string, commitSha: string) =>
  request<CommitSummary>(`/agent/summary/${projectId}/${commitSha}`, {
    method: "POST",
  });

export const listConversations = (projectId: string) =>
  request<AgentConversation[]>(`/agent/conversations/${projectId}`);

export const getConversationMessages = (conversationId: string) =>
  request<AgentMessage[]>(
    `/agent/conversations/${conversationId}/messages`
  );

export function streamAgentChat(
  projectId: string,
  message: string,
  conversationId?: string,
  trainingJobId?: string,
  onChunk?: (text: string) => void,
  onDone?: (conversationId: string) => void
) {
  const body = JSON.stringify({
    message,
    conversation_id: conversationId ?? null,
    training_job_id: trainingJobId ?? null,
  });

  fetch(`${API_BASE}/agent/chat/${projectId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).then(async (res) => {
    const reader = res.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          if (data.text) onChunk?.(data.text);
          if (data.done) onDone?.(data.conversation_id);
        }
      }
    }
  });
}
