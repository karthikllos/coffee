// components/AINotesGenerator.js
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AINotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [insufficientCredits, setInsufficientCredits] = useState(false);

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
    setInsufficientCredits(false);

    try {
      const response = await fetch("/api/ai/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      // ✅ Handle 402 Insufficient Credits
      if (response.status === 402) {
        console.warn("❌ Insufficient credits:", data);
        setInsufficientCredits(true);
        setError(data.message || "Insufficient credits. Please upgrade your plan.");
        return;
      }

      if (!response.ok) {
        setError(data.error || "Failed to generate notes");
        return;
      }

      setNotes(data.notes || "");
    } catch (err) {
      setError("Error generating notes: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-solid)]" />
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
            Transform your study materials into concise, AI-powered notes (1 credit)
          </p>
        </div>

        {/* ✅ 402 Insufficient Credits Modal */}
        {insufficientCredits && (
          <div className="mb-6 p-6 rounded-lg bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  Insufficient Credits
                </h3>
                <p className="text-red-300 mb-4">{error}</p>
                <div className="flex gap-3">
                  <Link
                    href="/pricing"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white font-medium hover:shadow-lg transition"
                  >
                    Upgrade Plan
                  </Link>
                  <button
                    onClick={() => setInsufficientCredits(false)}
                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && !insufficientCredits && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-yellow-400">{error}</p>
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
              <div className="prose prose-invert max-w-none">
                <div className="text-[var(--foreground)] whitespace-pre-wrap text-sm leading-relaxed">
                  {notes}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-[var(--text-tertiary)]">
                Your AI-generated notes will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}