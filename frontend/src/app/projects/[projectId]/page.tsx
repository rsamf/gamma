"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getProject } from "@/lib/api";
import { useJobs } from "@/hooks/useJobs";
import { JobTable } from "@/components/job-table";
import type { Project as ProjectType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AuthProvider } from "@/components/providers";

function ProjectContent() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [project, setProject] = useState<ProjectType | null>(null);
  const { jobs, loading: jobsLoading } = useJobs(projectId);

  useEffect(() => {
    if (projectId) {
      getProject(projectId).then(setProject);
    }
  }, [projectId]);

  if (!project) return <p className="text-muted-foreground">Loading project...</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <Link href="/" className="text-sm text-primary hover:underline inline-block mb-2">
            &larr; Projects
          </Link>
          <h2 className="text-3xl font-bold">{project.name}</h2>
          <p className="text-sm text-muted-foreground">{project.github_repo_full_name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/projects/${projectId}/experiments`}>
            <Button variant="outline">Experiments</Button>
          </Link>
          <Link href={`/projects/${projectId}/artifacts`}>
            <Button variant="outline">Artifacts</Button>
          </Link>
          <Link href={`/projects/${projectId}/agent`}>
            <Button className="bg-violet-600 hover:bg-violet-700">Agent Chat</Button>
          </Link>
        </div>
      </div>

      <section>
        <h3 className="text-xl font-semibold mb-3">Training Jobs</h3>
        {jobsLoading ? (
          <p className="text-muted-foreground">Loading jobs...</p>
        ) : (
          <JobTable jobs={jobs} projectId={projectId} />
        )}
      </section>
    </div>
  );
}

export default function Project() {
  return (
    <AuthProvider>
      <ProjectContent />
    </AuthProvider>
  );
}
