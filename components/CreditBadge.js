// components/CreditBadge.js
"use client";

import { useEffect, useState } from "react";
import { Zap, Loader2, Crown } from "lucide-react";
import { useSession } from "next-auth/react";

export default function CreditBadge() {
    const { data: session, status } = useSession();
    const [credits, setCredits] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCredits = async () => {
        if (!session) return;
        
        try {
            setLoading(true);
            const res = await fetch("/api/user/credits", {
                cache: "no-store",
            });
            
            if (!res.ok) {
                throw new Error("Failed to fetch credits");
            }
            
            const data = await res.json();
            setCredits(data);
            setError(null);
        } catch (err) {
            console.error("Error fetching credits:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchCredits();
        }
    }, [status]);

    if (loading || status === "loading") {
        return (
            <div className="flex items-center px-3 py-1 text-sm rounded-full bg-gray-100 dark:bg-gray-800">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Loading...</span>
            </div>
        );
    }

    if (error || !credits) {
        return (
            <button
                onClick={fetchCredits}
                className="flex items-center px-3 py-1 text-sm text-red-600 bg-red-100 rounded-full dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
            >
                <span>Error loading credits</span>
            </button>
        );
    }

    if (credits.isUnlimited) {
        return (
            <div className="flex items-center px-3 py-1 text-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-full">
                <Crown className="w-4 h-4 mr-1" />
                <span>Unlimited</span>
            </div>
        );
    }

    return (
        <div className="flex items-center px-3 py-1 text-sm text-white bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full">
            <Zap className="w-4 h-4 mr-1 fill-current" />
            <span>{credits.creditsRemaining} credits</span>
        </div>
    );
}