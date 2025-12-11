// app/ai/quiz/page.js - ENHANCED STYLING VERSION
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
// prettier-ignore
import { Loader2, Brain, Zap, CheckCircle, XCircle, ChevronRight, AlertCircle, Sparkles, Trophy, Target, Clock } from "lucide-react";
import toast from "react-hot-toast";

export default function AIQuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [error, setError] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  // --- Utility Functions/Hooks (Unchanged) ---

  // Fetch initial credits
  const fetchCredits = async () => {
    try {
      const res = await fetch("/api/user/credits");
      if (res.ok) {
        const data = await res.json();
        setCreditsRemaining(data.available || 0);
        setIsUnlimited(data.plan === 'Premium' || data.plan === 'Pro Max');
      }
    } catch (err) {
      console.error("Failed to fetch credits:", err);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated") {
      fetchCredits();
      setLoading(false);
    }
  }, [status, router]);

  const generateQuiz = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic for your quiz");
      setError("Please enter a topic");
      return;
    }

    // Check credits before making API call
    if (!isUnlimited && creditsRemaining < 2) {
      toast.error("Insufficient credits. You need 2 credits to generate a quiz.");
      setError("Insufficient credits. Please upgrade your plan or purchase more credits.");
      return;
    }

    setGenerating(true);
    setError("");
    setQuestions([]);
    setSelectedAnswers({});
    setShowResults(false);
    
    const loadingToast = toast.loading("🧠 Generating your personalized quiz...");

    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty, questionCount: 5 }),
      });

      const data = await res.json();
      toast.dismiss(loadingToast);

      if (!res.ok) {
        // Handle specific error codes
        if (res.status === 402) {
          toast.error("Insufficient credits. You need 2 credits to generate a quiz.");
          setError(data.error || "Insufficient credits");
        } else if (res.status === 401) {
          toast.error("Please log in to use AI features");
          router.push("/auth");
        } else {
          toast.error(data.error || "Failed to generate quiz");
          setError(data.error || "Failed to generate quiz");
        }
        return;
      }

      if (data.success && data.quiz && Array.isArray(data.quiz.questions)) {
        setQuestions(data.quiz.questions);
        setCreditsUsed(data.credits?.used ?? 2);
        
        // Update credits display
        if (data.credits) {
          setCreditsRemaining(data.credits.remaining);
          setIsUnlimited(data.credits.isUnlimited);
        } else {
          // Fallback: refetch credits
          await fetchCredits();
        }
        
        toast.success(`✨ Quiz generated! ${!isUnlimited ? `${data.credits?.used || 2} credits used.` : ''}`);
      } else {
        toast.error("Invalid response from server");
        setError("Invalid response from server");
        console.error("Quiz response:", data);
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error("Quiz generation error:", err);
      toast.error("Network error. Please try again.");
      setError("Error generating quiz: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerSelect = (questionId, selectedOption) => {
    if (showResults) return; // Prevent changes after submission
    
    setSelectedAnswers({
      ...selectedAnswers,
      [questionId]: selectedOption,
    });
  };

  const handleSubmitQuiz = () => {
    const unanswered = questions.length - Object.keys(selectedAnswers).length;
    
    if (unanswered > 0) {
      toast.error(`Please answer all questions. ${unanswered} remaining.`);
      return;
    }
    
    setShowResults(true);
    toast.success("Quiz submitted! Check your results below.");
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return { correct, total: questions.length };
  };

  if (loading) {
    return (
      // Loading State (Styling Unchanged - already good)
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-accent" />
          <span className="text-xl font-medium text-foreground">
            Initializing AI brain...
          </span>
        </div>
      </div>
    );
  }

  const score = showResults ? calculateScore() : null;
  const isAllAnswered = Object.keys(selectedAnswers).length === questions.length;
  const scorePercentage = score ? Math.round((score.correct / score.total) * 100) : 0;
  const lowCredit = !isUnlimited && creditsRemaining < 3;
  
  const getScoreMessage = (percentage) => {
    if (percentage === 100) return "🚀 Perfect Score! Unstoppable!";
    if (percentage >= 80) return "🧠 Excellent work! Deep understanding.";
    if (percentage >= 60) return "👍 Good effort! Keep practicing.";
    if (percentage >= 40) return "📚 Needs review. Let's learn together!";
    return "💡 Great learning opportunity! Review and try again.";
  };

  // Enhanced color gradient for score
  const getScoreColor = (percentage) => {
    if (percentage === 100) return "from-fuchsia-500 to-pink-500"; // Neon Pink/Purple
    if (percentage >= 80) return "from-green-400 to-cyan-500"; // Vibrant Green/Cyan
    if (percentage >= 60) return "from-blue-500 to-indigo-600"; // Deep Blue
    if (percentage >= 40) return "from-orange-400 to-red-500"; // Orange/Red warning
    return "from-red-500 to-rose-600"; // Deep Red
  };

  return (
    // General background and layout classes are unchanged
    <div className="min-h-screen bg-background text-foreground py-16 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header (Styling Unchanged) */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            {/* Added subtle motion/glow for modern effect */}
            <Brain className="h-10 w-10 text-accent glow-text animate-pulse" />
            {/* Assume 'gradient-text' and 'glow-text' are custom classes providing neon/gradient effects */}
            <h1 className="text-5xl font-extrabold tracking-tight gradient-text">
              AI Quiz Generator
            </h1>
          </div>
          <p className="text-text-secondary text-lg">
            Instantly create custom quizzes on any topic
          </p>
        </div>

        {/* Credits Status Bar (Minimal changes for style consistency) */}
        <div className={`mb-8 p-4 rounded-xl shadow-2xl border transition-all duration-300 ${
          lowCredit 
            ? 'bg-red-500/10 border-red-500/30 animate-pulse' 
            : 'bg-card-bg border-border-color'
        } hover:shadow-accent/30`}> {/* Added hover effect */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Zap className={`h-6 w-6 ${lowCredit ? 'text-red-400' : 'text-accent'}`} />
              <div>
                <p className="text-sm text-text-secondary">Your Credits</p>
                <p className={`text-2xl font-bold ${
                  isUnlimited ? 'text-purple-400' : lowCredit ? 'text-red-400' : 'text-accent'
                }`}>
                  {isUnlimited ? 'Unlimited ∞' : creditsRemaining}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-tertiary mb-1">Cost per quiz</p>
              <p className="text-lg font-bold text-accent">2 credits</p>
            </div>
            {!isUnlimited && lowCredit && (
              <button
                onClick={() => router.push("/pricing")}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-semibold text-sm hover:shadow-xl shadow-yellow-500/50 transition-all duration-200 hover:scale-[1.03]" // Enhanced button style
              >
                <Sparkles className="inline h-4 w-4 mr-1" />
                Upgrade Now
              </button>
            )}
          </div>
        </div>
        
        {/* Error Message (Minimal changes) */}
        {error && (
          <div className="mb-6 p-5 rounded-xl border-2 bg-red-900/40 border-red-500/50 shadow-lg shadow-red-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-400 font-semibold">{error}</p>
                {!isUnlimited && creditsRemaining < 2 && (
                  <button
                    onClick={() => router.push("/pricing")}
                    className="mt-3 px-4 py-2 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white font-bold transition duration-300 flex items-center gap-2 shadow-md hover:shadow-xl"
                  >
                    <Zap className="h-4 w-4" />
                    Get More Credits
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Input Section (Styling Enhanced) */}
        {questions.length === 0 && (
          <div className="p-8 bg-card-bg rounded-3xl shadow-3xl border border-accent/20 transition-all duration-500"> {/* Sharper shadow, more defined border */}
            <h2 className="text-3xl font-extrabold mb-6 text-foreground flex items-center gap-3 border-b pb-3 border-accent/10">
              <Target className="h-7 w-7 text-accent" />
              Define Your Challenge
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-medium mb-3 text-text-secondary">
                  Topic *
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Quantum Computing, Stoichiometry, React Hooks"
                  // Enhanced input style: Deeper background, focus ring more prominent
                  className="w-full px-5 py-3 rounded-xl bg-gray-800/50 border border-gray-700/80 text-foreground placeholder-gray-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent transition duration-300 text-lg"
                />
              </div>

              <div>
                <label className="block text-lg font-medium mb-3 text-text-secondary">
                  Difficulty Level
                </label>
                <div className="relative">
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    // Enhanced select style: Deeper background, uses 'appearance-none' for custom arrow (if needed)
                    className="w-full px-5 py-3 rounded-xl bg-gray-800/50 border border-gray-700/80 text-foreground focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent transition duration-300 appearance-none cursor-pointer text-lg pr-10"
                  >
                    <option value="easy">Easy - Fundamentals</option>
                    <option value="medium">Medium - Application</option>
                    <option value="hard">Hard - Advanced Concepts</option>
                  </select>
                  <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-accent rotate-90" />
                </div>
              </div>

              <button
                onClick={generateQuiz}
                disabled={generating || !topic.trim() || (!isUnlimited && creditsRemaining < 2)}
                // Enhanced button style: More impactful glow, stronger hover
                className="mt-8 w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-xl py-4 rounded-xl shadow-2xl shadow-accent/40 transform hover:scale-[1.02] transition duration-300 ease-in-out"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    Forging Questions...
                  </>
                ) : (
                  <>
                    <Brain className="h-6 w-6" />
                    Generate 5-Question Quiz ({isUnlimited ? 'Free' : '2 credits'})
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Quiz Display Section */}
        {questions.length > 0 && (
          <div className="space-y-8">
            {/* Quiz Header (Styling Enhanced) */}
            <div className="p-6 bg-card-bg rounded-2xl shadow-2xl border border-border-color border-l-8 border-accent transition-all duration-500"> {/* Thicker left border */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-extrabold mb-1 text-foreground">
                    Quiz: <span className="text-accent">{topic}</span>
                  </h2>
                  <p className="text-text-secondary flex items-center gap-2">
                    <Clock className="h-4 w-4 text-text-tertiary" />
                    Difficulty: <span className="capitalize font-bold text-blue-400">{difficulty}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-tertiary mb-1">Cost</p>
                  <p className="text-3xl font-extrabold text-red-400">
                    -{isUnlimited ? '0' : creditsUsed}
                  </p>
                </div>
              </div>
            </div>

            {/* Score Display (after submission) - Uses enhanced colors */}
            {showResults && score && (
              <div className={`p-8 rounded-2xl shadow-2xl bg-gradient-to-br ${getScoreColor(scorePercentage)} bg-opacity-20 border-2 border-current`}>
                <div className="text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-300 animate-pulse-slow" /> {/* Slow pulse effect */}
                  <h3 className="text-4xl font-extrabold mb-3 text-white shadow-text"> {/* Assume 'shadow-text' is a custom class */}
                    {getScoreMessage(scorePercentage)}
                  </h3>
                  <p className="text-8xl font-black mb-3 text-white leading-none">
                    {score.correct} / {score.total}
                  </p>
                  <p className="text-2xl font-medium text-gray-300">
                    Final Score: <span className={`font-bold ${
                      scorePercentage >= 80 ? 'text-green-300' : 
                      scorePercentage >= 60 ? 'text-blue-300' : 'text-orange-300'
                    }`}>{scorePercentage}%</span>
                  </p>
                </div>
              </div>
            )}

            {/* Questions */}
            <div className="space-y-8"> {/* Increased spacing */}
              {questions.map((q, idx) => {
                const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
                const isAnswered = selectedAnswers[q.id] !== undefined;

                return (
                  <div
                    key={q.id}
                    className={`p-7 rounded-xl shadow-lg transition-all duration-300 border-l-4 ${
                      showResults
                        ? isCorrect
                          ? "border-green-500 bg-green-900/15"
                          : "border-red-500 bg-red-900/15"
                        : "border-accent/50 bg-card-bg hover:shadow-2xl hover:border-accent/80" // Sharper hover
                    }`}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <h3 className="font-extrabold text-xl flex-1 text-foreground">
                        <span className="text-accent/90 mr-3 text-2xl">Q{idx + 1}:</span>
                        {q.question}
                      </h3>
                      {showResults && (
                        <div className="ml-4 p-2 rounded-full">
                          {isCorrect ? (
                            <CheckCircle className="h-7 w-7 text-green-500" />
                          ) : (
                            <XCircle className="h-7 w-7 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4"> {/* Increased option spacing */}
                      {q.options?.map((opt, optIdx) => {
                        const optionId = String.fromCharCode(97 + optIdx); // a, b, c, d
                        const isSelected = selectedAnswers[q.id] === optionId;
                        const isCorrectAnswer = q.correctAnswer === optionId;
                        
                        let optionClass = "border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer"; // ADDED CURSOR:POINTER AND BETTER HOVER
                        
                        // Enhanced color feedback
                        if (showResults) {
                          if (isCorrectAnswer) {
                            optionClass = "border-green-500 bg-green-800/50 font-bold text-white shadow-inner shadow-green-500/20";
                          } else if (isSelected && !isCorrectAnswer) {
                            optionClass = "border-red-500 bg-red-800/50 font-bold text-red-400 shadow-inner shadow-red-500/20";
                          } else {
                            optionClass = "border-gray-700/50 bg-gray-800/30 text-text-secondary/70";
                          }
                        } else if (isSelected) {
                          // SELECTED OPTION COLOR CHANGE: Vibrant accent color
                          optionClass = "border-accent bg-accent/30 font-bold shadow-inner shadow-accent/30 text-white"; 
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleAnswerSelect(q.id, optionId)}
                            disabled={showResults}
                            // Applied the new/enhanced classes
                            className={`w-full p-4 text-left rounded-xl border-2 transition duration-200 ease-in-out ${optionClass} ${showResults ? 'cursor-default' : 'hover:scale-[1.005] focus:outline-none focus:ring-2 focus:ring-accent'}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`font-extrabold w-6 text-center text-lg ${isSelected && !showResults ? 'text-white' : 'text-accent/80'}`}>
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span className="text-lg">{opt.text || opt}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {showResults && !isCorrect && isAnswered && (
                      <div className="mt-4 p-4 rounded-xl bg-green-900/40 border border-green-500/50 shadow-md shadow-green-500/10">
                        <p className="text-md text-green-400">
                          <CheckCircle className="inline h-4 w-4 mr-2" /> 
                          Correct answer: <span className="font-extrabold">
                            {q.options.find(o => o.id === q.correctAnswer)?.text || 
                             q.options[q.correctAnswer.charCodeAt(0) - 97]?.text || 
                             q.correctAnswer.toUpperCase()}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons (Styling Enhanced) */}
            <div className="flex flex-col gap-4 pt-4"> {/* Changed to flex-col for better mobile stacking, or keep as row if space is sufficient */}
              {!showResults ? (
                <>
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={!isAllAnswered}
                    // Enhanced submit button style
                    className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed transform hover:scale-[1.01] transition duration-300 py-4 text-xl shadow-2xl shadow-green-500/40"
                  >
                    {isAllAnswered ? (
                      <>
                        <Trophy className="inline h-5 w-5 mr-2" />
                        Submit Quiz & Get Score
                      </>
                    ) : (
                      <>
                        <AlertCircle className="inline h-5 w-5 mr-2" />
                        Answer All Questions ({Object.keys(selectedAnswers).length}/{questions.length})
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setQuestions([]);
                      setTopic("");
                      setSelectedAnswers({});
                      setError("");
                    }}
                    // Enhanced secondary button style
                    className="w-full px-6 py-3 rounded-xl text-accent border-2 border-accent bg-transparent hover:bg-accent/20 transition duration-300 font-semibold"
                  >
                    <ChevronRight className="inline h-4 w-4 mr-1" />
                    Start New Quiz
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setQuestions([]);
                    setTopic("");
                    setSelectedAnswers({});
                    setShowResults(false);
                    setError("");
                  }}
                  // Enhanced button style
                  className="w-full btn-primary transform hover:scale-[1.01] transition duration-300 flex items-center justify-center gap-2 py-4 text-xl shadow-2xl shadow-accent/40"
                >
                  <Brain className="h-6 w-6" />
                  Generate Another Quiz
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}