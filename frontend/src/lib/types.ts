export interface Profile {
  id: string;
  github_username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  github_repo_full_name: string;
  github_installation_id: number;
  s3_bucket: string;
  s3_prefix: string;
  mlflow_experiment_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  github_repo_full_name: string;
}

export interface GithubRepo {
  full_name: string;
  name: string;
  private: boolean;
  installation_id: number;
}

export type JobStatus = "pending" | "running" | "completed" | "failed";

export interface TrainingJob {
  id: string;
  project_id: string;
  commit_sha: string;
  branch: string;
  github_workflow_run_id: number | null;
  sagemaker_job_name: string | null;
  status: JobStatus;
  mlflow_run_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AgentConversation {
  id: string;
  project_id: string;
  training_job_id: string | null;
  created_at: string;
}

export interface AgentMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CommitSummary {
  id: string;
  project_id: string;
  commit_sha: string;
  summary: string;
  created_at: string;
}

export interface S3Artifact {
  key: string;
  size: number;
  last_modified: string;
  etag: string;
}

export interface MLflowExperiment {
  experiment_id: string;
  name: string;
  artifact_location: string;
  lifecycle_stage: string;
}

export interface MLflowRun {
  info: {
    run_id: string;
    experiment_id: string;
    status: string;
    start_time: number;
    end_time: number;
  };
  data: {
    metrics: Array<{ key: string; value: number; timestamp: number; step: number }>;
    params: Array<{ key: string; value: string }>;
  };
}

export interface MetricHistory {
  key: string;
  value: number;
  timestamp: number;
  step: number;
}
