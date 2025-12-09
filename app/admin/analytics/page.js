"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, DollarSign, Loader2 } from "lucide-react";

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    } else if (status === "authenticated" && session?.user) {
      // TODO: Check if user is admin
      fetchAnalytics();
    }
  }, [status, session, router]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics/subscriptions");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch analytics");
        return;
      }

      setAnalytics(data);
    } catch (err) {
      setError("Error fetching analytics: " + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-solid)]" />
          <span className="text-lg font-medium">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-400">Error: {error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-3 btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-[var(--background)] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-[var(--text-secondary)]">No analytics data available</p>
        </div>
      </div>
    );
  }

  const {
    totalUsers = 0,
    paidUsers = 0,
    freeUsers = 0,
    totalRevenue = 0,
    monthlyRecurringRevenue = 0,
    subscriptionBreakdown = {},
    churnRate = 0,
    conversionRate = 0,
    averageRevenuePerUser = 0,
  } = analytics;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-8 w-8 text-[var(--accent-solid)]" />
            <h1 className="text-4xl font-bold">Admin Analytics</h1>
          </div>
          <p className="text-[var(--text-secondary)]">
            Subscription and revenue analytics dashboard
          </p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 btn-secondary text-sm"
          >
            Refresh Data
          </button>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Users */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium mb-1">
                  Total Users
                </p>
                <p className="text-3xl font-bold">{totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          {/* Paid Users */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium mb-1">
                  Paid Users
                </p>
                <p className="text-3xl font-bold">{paidUsers}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : 0}% conversion
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>

          {/* Free Users */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium mb-1">
                  Free Users
                </p>
                <p className="text-3xl font-bold">{freeUsers}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  {totalUsers > 0 ? ((freeUsers / totalUsers) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          {/* Total Revenue */}
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-sm font-medium mb-1">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Revenue Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* MRR */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Monthly Recurring Revenue</h3>
            <p className="text-4xl font-bold text-green-500 mb-2">
              ₹{monthlyRecurringRevenue.toLocaleString()}
            </p>
            <p className="text-[var(--text-secondary)] text-sm">
              Recurring monthly revenue from active subscriptions
            </p>
          </div>

          {/* ARPU */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Average Revenue Per User</h3>
            <p className="text-4xl font-bold text-blue-500 mb-2">
              ₹{averageRevenuePerUser.toLocaleString()}
            </p>
            <p className="text-[var(--text-secondary)] text-sm">
              Total revenue divided by paid users
            </p>
          </div>
        </div>

        {/* Subscription Breakdown */}
        <div className="card mb-8">
          <h3 className="text-xl font-semibold mb-6">Subscription Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(subscriptionBreakdown).map(([plan, data]) => (
              <div key={plan} className="p-4 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)]">
                <h4 className="font-semibold text-lg mb-3 capitalize">{plan}</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-[var(--text-tertiary)] text-sm">Users</p>
                    <p className="text-2xl font-bold">{data.count || 0}</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-tertiary)] text-sm">Revenue</p>
                    <p className="text-xl font-bold text-green-500">
                      ₹{(data.revenue || 0).toLocaleString()}
                    </p>
                  </div>
                  {data.monthlyPrice && (
                    <div>
                      <p className="text-[var(--text-tertiary)] text-sm">Monthly Price</p>
                      <p className="text-lg">₹{data.monthlyPrice.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Churn & Conversion */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Churn Rate */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Churn Rate</h3>
            <p className="text-4xl font-bold text-red-500 mb-2">
              {churnRate.toFixed(2)}%
            </p>
            <p className="text-[var(--text-secondary)] text-sm">
              Percentage of users who canceled their subscription
            </p>
          </div>

          {/* Conversion Rate */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Conversion Rate</h3>
            <p className="text-4xl font-bold text-green-500 mb-2">
              {conversionRate.toFixed(2)}%
            </p>
            <p className="text-[var(--text-secondary)] text-sm">
              Percentage of free users who converted to paid
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}