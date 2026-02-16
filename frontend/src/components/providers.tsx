"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { Button } from "./ui/button";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, signInWithGitHub, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-5xl font-bold tracking-tight">Gamma</h1>
        <p className="text-lg text-muted-foreground">ML Development Platform</p>
        <Button onClick={signInWithGitHub} size="lg" className="mt-6">
          Sign in with GitHub
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-3 bg-card border-b">
        <Link href="/" className="text-2xl font-bold">
          Gamma
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {user.user_metadata?.user_name ?? user.email}
          </span>
          <Button onClick={signOut} variant="outline" size="sm">
            Sign out
          </Button>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
