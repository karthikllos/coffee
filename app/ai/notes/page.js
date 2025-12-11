// app/ai/notes/page.js - FIXED VERSION
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Loader2, Sparkles, Zap, BatteryCharging, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AINotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [error, setError] = useState("");

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

  const generateNotes = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content to generate notes from");
      setError("Input data required.");
      return;
    }

    // Check credits before making API call
    if (!isUnlimited && creditsRemaining < 1) {
      toast.error("Insufficient credits. Please upgrade your plan.");
      setError("Insufficient power. Upgrade for more credits.");
      return;
    }

    setGenerating(true);
    setError("");
    const loadingToast = toast.loading("Generating AI notes...");

    try {
      const response = await fetch("/api/ai/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 402) {
          toast.error("Insufficient credits. Please upgrade or purchase more credits.");
          setError(data.error || "Insufficient credits");
        } else if (response.status === 401) {
          toast.error("Please log in to use AI features");
          router.push("/auth");
        } else {
          toast.error(data.error || "Failed to generate notes");
          setError(data.error || "System failure: Notes generation aborted.");
        }
        return;
      }

      // Success!
      setNotes(data.notes || "Note generation successful, but response was empty.");
      
      // Update credits display
      if (data.credits) {
        setCreditsRemaining(data.credits.remaining);
        setIsUnlimited(data.credits.isUnlimited);
      } else {
        // Fallback: refetch credits
        await fetchCredits();
      }
      
      toast.success(`✨ Notes generated successfully! ${!isUnlimited ? `${data.credits?.used || 1} credit used.` : ''}`);
      
    } catch (err) {
      toast.dismiss(loadingToast);
      console.error("Notes generation error:", err);
      toast.error("Network error. Please try again.");
      setError("Critical network fault: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400 drop-shadow-lg shadow-cyan-400/50" />
          <span className="text-xl font-mono text-cyan-300 tracking-wider">INITIATING PROTOCOL...</span>
        </div>
      </div>
    );
  }

  const lowCredit = !isUnlimited && creditsRemaining < 3;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header & Status Bar */}
        <div className="mb-12 border-b border-cyan-700/50 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Sparkles className="h-10 w-10 text-purple-400 drop-shadow-lg shadow-purple-400/70" />
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                A.I. Note Synthesis Unit
              </h1>
            </div>
            
            {/* Credit Status */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
              lowCredit 
                ? 'border-red-500 bg-red-900/30 animate-pulse' 
                : 'border-cyan-500 bg-cyan-900/30'
            } shadow-lg`}>
              <BatteryCharging className={`h-5 w-5 ${lowCredit ? 'text-red-400' : 'text-cyan-400'}`} />
              <span className={`text-lg font-mono tracking-widest ${
                lowCredit ? 'text-red-300' : 'text-cyan-300'
              }`}>
                {isUnlimited ? 'UNLIMITED' : `POWER: ${creditsRemaining}`}
              </span>
              {!isUnlimited && (
                <Link href="/pricing" className="ml-2 text-xs text-purple-300 hover:text-purple-400 underline flex items-center">
                  <ExternalLink className="h-3 w-3 mr-1"/> Recharge
                </Link>
              )}
            </div>
          </div>
          <p className="text-gray-400 text-lg font-mono tracking-wide">
            DATA INPUT & PROCESSING TERMINAL V1.1
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-900/50 border border-red-500 shadow-xl shadow-red-500/10 transition-all duration-300">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-400 font-mono tracking-wide">
                  <span className="font-bold mr-2">// ERROR:</span> {error}
                </p>
                {!isUnlimited && creditsRemaining < 1 && (
                  <Link 
                    href="/pricing" 
                    className="mt-2 inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-400 underline"
                  >
                    <Zap className="h-4 w-4" />
                    Upgrade to continue using AI features
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Input Section */}
          <div className="bg-gray-800/20 p-8 rounded-2xl border border-cyan-800/50 shadow-2xl shadow-cyan-900/30 backdrop-blur-sm h-full flex flex-col transition-all duration-300 hover:border-cyan-700">
            <h2 className="text-2xl font-bold mb-5 text-cyan-400 border-b border-cyan-700/50 pb-2">SOURCE DATA INPUT</h2>
            
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste raw data here (text, documents, excerpts)..."
              className="flex-1 w-full h-80 min-h-64 p-5 rounded-lg bg-gray-900/70 border-2 border-purple-800/50 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 shadow-inner shadow-gray-900/50 transition duration-300 font-mono text-sm"
            />
            
            <button
              onClick={generateNotes}
              disabled={generating || !content.trim() || (!isUnlimited && creditsRemaining < 1)}
              className={`mt-6 w-full px-6 py-3 rounded-xl font-bold text-lg transition duration-300 shadow-xl flex items-center justify-center gap-3 tracking-widest ${
                generating || !content.trim() || (!isUnlimited && creditsRemaining < 1)
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600'
                  : 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-500 hover:to-cyan-400 hover:scale-[1.01] shadow-purple-600/50'
              }`}
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  PROCESSING DATA...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  SYNTHESIZE NOTES ({isUnlimited ? 'FREE' : '1 UNIT'})
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-gray-800/20 p-8 rounded-2xl border border-cyan-800/50 shadow-2xl shadow-cyan-900/30 backdrop-blur-sm h-full flex flex-col transition-all duration-300 hover:border-cyan-700">
            <h2 className="text-2xl font-bold mb-5 text-cyan-400 border-b border-cyan-700/50 pb-2">SYNTHESIS OUTPUT</h2>
            
            <div className="flex-1 overflow-y-auto">
              {notes ? (
                <div className="prose prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed p-5 bg-black/50 rounded-lg border-2 border-purple-800/50 text-cyan-300 shadow-inner shadow-black/70">
                    {notes}
                  </pre>
                  <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Notes generated successfully</span>
                  </div>
                </div>
              ) : (
                <div className="h-80 min-h-64 flex items-center justify-center text-gray-600 border-2 border-dashed border-cyan-800 rounded-lg p-5 bg-black/30">
                  <p className="text-center font-mono tracking-wider">
                    <Sparkles className="h-6 w-6 inline-block mb-2 text-purple-400"/>
                    <br/>
                    SYNTHESIS ENGINE STANDBY<br/>
                    Awaiting Data Input for AI Processing...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}