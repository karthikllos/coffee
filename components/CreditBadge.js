"use client";

import { useEffect, useState } from "react";
import { Zap, Crown, Infinity } from "lucide-react";

export default function CreditBadge() {
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch("/api/user/credits?t=" + Date.now());
        if (res.ok) {
          const data = await res.json();
          setCredits(data);
        }
      } catch (error) {
        console.error("Failed to fetch credits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();

    // Refetch every 30 seconds
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !credits) {
    return (
      <div className="px-3 py-1.5 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] animate-pulse">
        <span className="text-xs font-medium">Loading...</span>
      </div>
    );
  }

  // Premium/Pro Max - Unlimited
  if (credits.isUnlimited) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white border border-purple-400">
        <Crown className="h-4 w-4" />
        <span className="text-xs font-semibold">Unlimited</span>
      </div>
    );
  }

  // Pro - Monthly allowance
  if (credits.subscriptionPlan === "Pro") {
    const used = 50 - credits.creditsRemaining;
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white border border-blue-400">
        <Zap className="h-4 w-4" />
        <span className="text-xs font-semibold">{credits.creditsRemaining}/50</span>
      </div>
    );
  }

  // Free/Starter - Purchased credits
  if (credits.creditsRemaining <= 0) {
    return (
      <a
        href="/pricing"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-orange-600 text-white border border-red-400 hover:shadow-lg transition cursor-pointer"
      >
        <Zap className="h-4 w-4" />
        <span className="text-xs font-semibold">0 Credits</span>
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white border border-green-400">
      <Zap className="h-4 w-4" />
      <span className="text-xs font-semibold">{credits.creditsRemaining}</span>
    </div>
  );
}