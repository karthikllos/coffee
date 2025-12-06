"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AINotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated") {
      setLoading(false);
    }
  }, [status, router]);

  const generateNotes = async () => {
    if (!content.trim()) {
      setError("Please enter content to summarize");
      return;
    }

    setGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/ai/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate notes");
        return;
      }

      setNotes(data.notes);
      setCreditsRemaining(data.creditsRemaining);
    } catch (err) {
      setError("Error generating notes: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-solid)]" />
          <span className="text-lg font-medium text-[var(--foreground)]">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-[var(--accent-solid)]" />
            <h1 className="text-4xl font-bold">AI Notes Summarizer</h1>
          </div>
          <p className="text-[var(--text-secondary)]">
            Transform your study materials into concise, AI-powered notes
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)]">Paste Content</h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your study material, lecture notes, or textbook excerpt here..."
              className="w-full h-64 p-4 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-solid)]"
            />
            <button
              onClick={generateNotes}
              disabled={generating || !content.trim()}
              className="mt-4 w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Notes (1 credit)
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)]">AI Summary</h2>
            {notes ? (
              <div className="prose prose-invert max-w-none prose-sm">
                <div className="text-[var(--foreground)] whitespace-pre-wrap text-sm leading-relaxed">
                  {notes}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-[var(--text-tertiary)]">
                Your AI-generated notes will appear here
              </div>
            )}
            {creditsRemaining !== undefined && (
              <p className="mt-4 text-xs text-[var(--text-tertiary)]">
                Credits remaining: {creditsRemaining}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}