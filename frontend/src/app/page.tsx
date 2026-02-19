"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";
import { createProject, listGithubRepos } from "@/lib/api";
import type { GithubRepo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AuthProvider } from "@/components/providers";

const GITHUB_APP_SLUG = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ?? "";
const GITHUB_INSTALL_URL = GITHUB_APP_SLUG
  ? `https://github.com/apps/${GITHUB_APP_SLUG}/installations/new`
  : "https://github.com/settings/apps";

function RepoCombobox({
  repos,
  value,
  onChange,
}: {
  repos: GithubRepo[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = repos.find((r) => r.full_name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span>
              {selected.full_name}
              {selected.private && (
                <span className="ml-2 text-xs text-muted-foreground">(private)</span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">Select a repository…</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search repositories…" />
          <CommandList>
            <CommandEmpty>No repository found.</CommandEmpty>
            <CommandGroup>
              {repos.map((repo) => (
                <CommandItem
                  key={repo.full_name}
                  value={repo.full_name}
                  onSelect={(v) => {
                    onChange(v === value ? "" : v);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === repo.full_name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {repo.full_name}
                  {repo.private && (
                    <span className="ml-2 text-xs text-muted-foreground">(private)</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { projects, loading, refetch } = useProjects(user?.id);
  const [showForm, setShowForm] = useState(false);
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [creating, setCreating] = useState(false);

  const handleShowForm = async () => {
    if (showForm) {
      setShowForm(false);
      return;
    }
    setShowForm(true);
    if (!user) return;
    setReposLoading(true);
    setReposError(null);
    try {
      const data = await listGithubRepos(user.id);
      setRepos(data);
    } catch (e) {
      setReposError(e instanceof Error ? e.message : "Failed to load repositories");
    } finally {
      setReposLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !selectedRepo) return;
    setCreating(true);
    try {
      await createProject({ github_repo_full_name: selectedRepo }, user.id);
      setShowForm(false);
      setSelectedRepo("");
      setRepos([]);
      refetch();
    } finally {
      setCreating(false);
    }
  };

  const reposNotInstalled = !reposLoading && !reposError && repos.length === 0 && showForm;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Projects</h2>
        <Button onClick={handleShowForm}>
          {showForm ? "Cancel" : "+ New Project"}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            {reposLoading ? (
              <p className="text-sm text-muted-foreground">Loading repositories…</p>
            ) : reposError ? (
              <p className="text-sm text-destructive">{reposError}</p>
            ) : reposNotInstalled ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  No repositories found. Install the GitHub App on your account to grant access.
                </p>
                <a
                  href={GITHUB_INSTALL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Install GitHub App
                </a>
              </div>
            ) : (
              <>
                <RepoCombobox repos={repos} value={selectedRepo} onChange={setSelectedRepo} />
                <Button onClick={handleCreate} disabled={!selectedRepo || creating}>
                  {creating ? "Creating…" : "Create Project"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading projects…</p>
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
