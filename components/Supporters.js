"use client";

import { useEffect, useState } from "react";

export default function Supporters({ username }) {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/payments?username=${encodeURIComponent(username)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Failed to fetch payments");
        const data = await res.json();
        setPayments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch payments", err);
      }
    };

    fetchData();

    const onUpdated = (e) => {
      if (!e?.detail?.username || e.detail.username !== username) return;
      if (e.detail?.payment) {
        setPayments((prev) => [e.detail.payment, ...prev]);
      } else {
        fetchData();
      }
    };

    window.addEventListener("payments-updated", onUpdated);
    return () => window.removeEventListener("payments-updated", onUpdated);
  }, [username]);

  const getAvatarData = (supporter) => {
    if (!supporter) return { avatar: "?", bgColor: "bg-gray-500" };
    const avatarColors = [
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    const firstLetter = supporter.charAt(0).toUpperCase();
    const avatarColor =
      avatarColors[supporter.charCodeAt(0) % avatarColors.length];
    return {
      avatar: firstLetter,
      bgColor: avatarColor,
    };
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  };

  // Only show 4 most recent
  const recentSupporters = payments.slice(0, 4);

  // Unified Recent Supporters Component - Shows only 4 most recent
const UnifiedRecentSupporters = ({ supporters = [] }) => {
  // Show only the 4 most recent supporters
  const recentSupporters = supporters.slice(0, 4);

  const getAvatarData = (supporter) => {
    const avatarColors = ['bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'];
    const firstLetter = supporter.charAt(0).toUpperCase();
    const avatarColor = avatarColors[supporter.charCodeAt(0) % avatarColors.length];
    return {
      avatar: firstLetter,
      bgColor: avatarColor
    };
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  };

  return (
    <div className="space-y-6 order-1 lg:order-2">
      <div className="text-center lg:text-left">
        <h3 
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--foreground)' }}
        >
          Recent Supporters
        </h3>
        <p 
          className="text-sm"
          style={{ color: 'var(--muted)' }}
        >
          See how your community shows appreciation
        </p>
      </div>

      {/* Support Messages */}
      <div className="space-y-4">
        {recentSupporters.length === 0 ? (
          <div 
            className="text-center py-8 rounded-2xl border backdrop-blur-sm"
            style={{ 
              backgroundColor: 'var(--surface, rgba(255,255,255,0.9))',
              borderColor: 'var(--border, rgba(0,0,0,0.1))',
              color: 'var(--muted)'
            }}
          >
            <div className="text-4xl mb-2">☕</div>
            <p>No supporters yet. Be the first!</p>
          </div>
        ) : (
          recentSupporters.map((support, idx) => {
            const avatarData = getAvatarData(support.supporter);
            return (
              <div 
                key={`${support.supporter}-${support.timestamp}-${idx}`}
                className="p-4 rounded-2xl border backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300"
                style={{ 
                  backgroundColor: 'var(--surface, rgba(255,255,255,0.9))',
                  borderColor: 'var(--border, rgba(0,0,0,0.1))'
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${avatarData.bgColor} shadow-md`}>
                    {avatarData.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="font-semibold"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {support.supporter}
                      </span>
                      <span 
                        className="text-sm"
                        style={{ color: 'var(--muted)' }}
                      >
                        bought {support.amount} chai{support.amount !== 1 ? "s" : ""}
                      </span>
                      {support.amount >= 5 && <span className="text-lg">🎉</span>}
                      <span 
                        className="text-xs ml-auto"
                        style={{ color: 'var(--muted)' }}
                      >
                        {formatTimeAgo(support.timestamp)}
                      </span>
                    </div>
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--muted)' }}
                    >
                      {support.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Show indicator if there are more than 4 supporters */}
        {supporters.length > 4 && (
          <div 
            className="text-center py-2 text-xs"
            style={{ color: 'var(--muted)' }}
          >
            and {supporters.length - 4} more supporters...
          </div>
        )}
      </div>
    </div>
  );
};
}
