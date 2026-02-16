"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { createProject } from "@/lib/api";
import type { ProjectCreate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AuthProvider } from "@/components/providers";

function DashboardContent() {
  const { user } = useAuth();
  const { projects, loading, refetch } = useProjects(user?.id);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProjectCreate>({
    name: "",
    github_repo_full_name: "",
    github_installation_id: 0,
    s3_bucket: "",
  });

  const handleCreate = async () => {
    if (!user) return;
    await createProject(form, user.id);
    setShowForm(false);
    setForm({ name: "", github_repo_full_name: "", github_installation_id: 0, s3_bucket: "" });
    refetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Projects</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Project"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <Input
              placeholder="Project name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              placeholder="GitHub repo (owner/repo)"
              value={form.github_repo_full_name}
              onChange={(e) => setForm({ ...form, github_repo_full_name: e.target.value })}
            />
            <Input
              placeholder="GitHub App Installation ID"
              type="number"
              value={form.github_installation_id || ""}
              onChange={(e) =>
                setForm({ ...form, github_installation_id: parseInt(e.target.value) || 0 })
              }
            />
            <Input
              placeholder="S3 Bucket"
              value={form.s3_bucket}
              onChange={(e) => setForm({ ...form, s3_bucket: e.target.value })}
            />
            <Button onClick={handleCreate}>Create Project</Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="text-muted-foreground">No projects yet. Create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <CardDescription>{project.github_repo_full_name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
