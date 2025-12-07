// components/AIQuizPage.js
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, Brain, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AIQuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated") {
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
    setInsufficientCredits(false);
    setShowResults(false);
    setUserAnswers({});

    try {
      const response = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty, questionCount: parseInt(questionCount) }),
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
        setError(data.error || "Failed to generate quiz");
        return;
      }

      setQuestions(data.quiz.questions || []);
    } catch (err) {
      setError("Error generating quiz: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) };
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
            <Brain className="h-8 w-8 text-[var(--accent-solid)]" />
            <h1 className="text-4xl font-bold">AI Quiz Generator</h1>
          </div>
          <p className="text-[var(--text-secondary)]">
            Create custom quizzes to test your knowledge (2 credits per quiz)
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

        {/* Quiz Generator Form */}
        {questions.length === 0 && (
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-6 text-[var(--foreground)]">Create Your Quiz</h2>

            <div className="space-y-4">
              {/* Topic Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, World War II, Calculus"
                  className="w-full px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-solid)]"
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-solid)]"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Question Count */}
              <div>
                <label className="block text-sm font-medium mb-2">Number of Questions</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--accent-solid)]"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={generateQuiz}
                disabled={generating || !topic.trim()}
                className="w-full mt-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </div>
        )}

        {/* Quiz Display */}
        {questions.length > 0 && !showResults && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-2xl font-semibold mb-6">{topic} Quiz</h2>

              {questions.map((q, idx) => (
                <div key={q.id} className="mb-8 pb-8 border-b border-[var(--card-border)] last:border-b-0">
                  <h3 className="font-semibold mb-4">
                    Q{idx + 1}: {q.question}
                  </h3>
                  <ul className="space-y-2">
                    {q.options.map((opt) => (
                      <li key={opt.id}>
                        <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] cursor-pointer hover:border-[var(--accent-solid)] transition">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            value={opt.id}
                            checked={userAnswers[q.id] === opt.id}
                            onChange={() => handleAnswerChange(q.id, opt.id)}
                            className="h-4 w-4"
                          />
                          <span>{opt.text}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <button
                onClick={() => setShowResults(true)}
                disabled={Object.keys(userAnswers).length < questions.length}
                className="w-full mt-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Quiz
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && questions.length > 0 && (
          <div className="card">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Quiz Complete!</h2>
              {(() => {
                const { correct, total, percentage } = calculateScore();
                return (
                  <div>
                    <div className="text-6xl font-bold text-[var(--accent-solid)] mb-2">
                      {percentage}%
                    </div>
                    <p className="text-xl text-[var(--text-secondary)]">
                      You got {correct} out of {total} questions correct
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Review Answers */}
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className={`p-4 rounded-lg ${
                    userAnswers[q.id] === q.correctAnswer
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-red-500/10 border border-red-500/30"
                  }`}
                >
                  <h4 className="font-semibold mb-2">
                    Q{idx + 1}: {q.question}
                  </h4>
                  <p className="text-sm mb-2">
                    {userAnswers[q.id] === q.correctAnswer ? "✅ Correct" : "❌ Incorrect"}
                  </p>
                  <p className="text-sm">
                    Your answer: <span className="font-medium">{userAnswers[q.id]}</span>
                  </p>
                  {userAnswers[q.id] !== q.correctAnswer && (
                    <p className="text-sm text-green-400 mt-1">
                      Correct answer: <span className="font-medium">{q.correctAnswer}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setQuestions([]);
                  setTopic("");
                  setUserAnswers({});
                  setShowResults(false);
                }}
                className="flex-1 btn-primary"
              >
                Generate Another Quiz
              </button>
              <Link href="/dashboard" className="flex-1 btn-secondary text-center">
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}