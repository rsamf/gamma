"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { listArtifacts, getDownloadUrl } from "@/lib/api";
import { ArtifactList } from "@/components/artifact-list";
import type { S3Artifact } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { AuthProvider } from "@/components/providers";

function ArtifactsContent() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [artifacts, setArtifacts] = useState<S3Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefix, setPrefix] = useState("");

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      listArtifacts(projectId, prefix)
        .then(setArtifacts)
        .finally(() => setLoading(false));
    }
  }, [projectId, prefix]);

  const handleDownload = async (key: string) => {
    if (!projectId) return;
    const { url } = await getDownloadUrl(projectId, key);
    window.open(url, "_blank");
  };

  return (
    <div>
      <Link href={`/projects/${projectId}`} className="text-sm text-primary hover:underline inline-block mb-3">
        &larr; Back to project
      </Link>
      <h2 className="text-3xl font-bold mb-5">Artifacts & Checkpoints</h2>

      <div className="mb-4">
        <Input
          placeholder="Filter by prefix..."
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading artifacts...</p>
      ) : (
        <ArtifactList artifacts={artifacts} onDownload={handleDownload} />
      )}
    </div>
  );
}

export default function Artifacts() {
  return (
    <AuthProvider>
      <ArtifactsContent />
    </AuthProvider>
  );
}
