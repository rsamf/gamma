"use client";

import type { S3Artifact } from "@/lib/types";
import { Button } from "./ui/button";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface Props {
  artifacts: S3Artifact[];
  onDownload: (key: string) => void;
}

export function ArtifactList({ artifacts, onDownload }: Props) {
  if (artifacts.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No artifacts found.</p>;
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-4 text-sm font-semibold">Key</th>
            <th className="text-left p-4 text-sm font-semibold">Size</th>
            <th className="text-left p-4 text-sm font-semibold">Last Modified</th>
            <th className="text-left p-4 text-sm font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          {artifacts.map((artifact) => (
            <tr key={artifact.key} className="border-b last:border-0">
              <td className="p-4 text-sm">
                <code className="text-xs break-all">{artifact.key}</code>
              </td>
              <td className="p-4 text-sm">{formatSize(artifact.size)}</td>
              <td className="p-4 text-sm text-muted-foreground">
                {new Date(artifact.last_modified).toLocaleString()}
              </td>
              <td className="p-4 text-sm">
                <Button size="sm" onClick={() => onDownload(artifact.key)}>
                  Download
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
