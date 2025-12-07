"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, Brain, Zap } from "lucide-react";

export default function AIQuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [error, setError] = useState("");
  const [isInsufficientCredits, setIsInsufficientCredits] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated") {
      // OPTIONAL: Fetch initial credit count here if you create the GET /api/user/credits route
      setLoading(false);
    }
  }, [status, router]);

  const generateQuiz = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    setGenerating(true);
    setError("");
    setIsInsufficientCredits(false); // Reset credit error state

    try {
      const response = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          setError(data.error || "Insufficient credits. Please upgrade.");
          setIsInsufficientCredits(true); // Set state to show CTA
        } else {
          setError(data.error || "Failed to generate quiz");
        }
        setCreditsRemaining(data.creditsRemaining || creditsRemaining);
        return;
      }

      // Success
      setQuestions(data.questions || []);
      setCreditsRemaining(data.creditsRemaining);
      // Clear topic on success, if desired
      setTopic(""); 

    } catch (err) {
      setError("Error generating quiz: " + err.message);
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
            <Brain className="h-8 w-8 text-[var(--accent-solid)]" />
            <h1 className="text-4xl font-bold">AI Quiz Generator</h1>
          </div>
          <p className="text-[var(--text-secondary)]">
            Create custom quizzes to test your knowledge on any topic (Cost: 2 credits)
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg border ${isInsufficientCredits ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <p className={`${isInsufficientCredits ? 'text-yellow-400' : 'text-red-400'}`}>{error}</p>
            
            {/* INSUFFICIENT CREDITS CALL TO ACTION */}
            {isInsufficientCredits && (
              <button 
                onClick={() => router.push("/pricing")} 
                className="mt-3 btn-primary bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Upgrade Your Plan / Get More Credits
              </button>
            )}
          </div>
        )}

        {/* Input Section */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)]">Topic</h2>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Photosynthesis, World War II, Calculus"
            className="w-full px-4 py-3 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-solid)]"
          />
          <button
            onClick={generateQuiz}
            disabled={generating || !topic.trim()}
            className="mt-4 w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Generate Quiz (2 credits)
              </>
            )}
          </button>
        </div>

        {/* Questions Section */}
        {questions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold mb-6">Quiz Questions</h2>
            {questions.map((q, idx) => (
              <div key={idx} className="card">
                <h3 className="font-semibold mb-3 text-[var(--foreground)]">
                  Q{idx + 1}: {q.question}
                </h3>
                <ul className="space-y-2">
                  {q.options?.map((opt, optIdx) => (
                    <li
                      key={optIdx}
                      // NOTE: You'll want to add logic here to allow users to select an answer and check correctness
                      className="p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] cursor-pointer hover:border-[var(--accent-solid)] transition"
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {creditsRemaining !== undefined && (
              <p className="text-sm text-[var(--text-tertiary)]">
                Credits remaining after generation: {creditsRemaining}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}