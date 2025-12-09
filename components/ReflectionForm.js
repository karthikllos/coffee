"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star, CheckCircle2, Circle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ReflectionForm({ date = new Date(), onSuccess = () => {} }) {
  const router = useRouter();

  const [energyRating, setEnergyRating] = useState(5);
  const [focusRating, setFocusRating] = useState(5);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [hoursSpent, setHoursSpent] = useState(0);
  const [aiSummary, setAiSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch tasks for the day on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        // Fetch scheduled tasks for today
        const blueprint = await fetch("/api/planner/blueprint").then((r) => r.json());
        const allTasks = [
          ...(blueprint.scheduledTasks || []),
          ...(blueprint.unscheduledTasks || []),
        ];
        setTasks(allTasks);
        setCompletedTaskIds([]);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        toast.error("Could not load today's tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [date]);

  const toggleTaskCompletion = (taskId) => {
    setCompletedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      // Calculate uncompleted tasks
      const uncompletedTaskIds = tasks
        .map((t) => t.taskId || t.id)
        .filter((id) => !completedTaskIds.includes(id));

      const payload = {
        date: date.toISOString(),
        energyRating: Number(energyRating),
        focusRating: Number(focusRating),
        completedTasks: completedTaskIds,
        uncompletedTasks: uncompletedTaskIds,
        tasksReviewed: tasks.length,
        tasksCompletedCount: parseInt(tasksCompleted),
        totalHoursSpent: parseFloat(hoursSpent),
        aiSummary,
      };

      const res = await fetch("/api/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit reflection");

      toast.success("Reflection saved! Tasks will be rescheduled.");
      onSuccess(data);
      router.refresh();
    } catch (err) {
      console.error("Reflection submission error:", err);
      toast.error(err?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Evening Reflection
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            How was your day? Take a moment to reflect and track your progress.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Energy Rating */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-900 dark:text-white">
              Energy Level:{" "}
              <span className="text-lg font-bold">{energyRating}/10</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={energyRating}
              onChange={(e) => setEnergyRating(e.target.value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-1">
              <span>Exhausted</span>
              <span>Energized</span>
            </div>
          </div>

          {/* Focus Rating */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-900 dark:text-white">
              Focus Level:{" "}
              <span className="text-lg font-bold">{focusRating}/10</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={focusRating}
              onChange={(e) => setFocusRating(e.target.value)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-1">
              <span>Distracted</span>
              <span>Focused</span>
            </div>
          </div>

          {/* Tasks Completed */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tasks Completed
            </label>
            <input
              type="number"
              min="0"
              value={tasksCompleted}
              onChange={(e) => setTasksCompleted(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)]"
            />
          </div>

          {/* Hours Spent */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Hours Spent Studying
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={hoursSpent}
              onChange={(e) => setHoursSpent(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)]"
            />
          </div>

          {/* AI Summary */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Today's Summary (Optional)
            </label>
            <textarea
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              placeholder="How was your day? What did you learn?"
              rows="4"
              className="w-full px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)]"
            />
          </div>

          {/* Submit Section */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60 transition"
            >
              {submitting ? (
                <>
                  <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                  Saving Reflection...
                </>
              ) : (
                "Save Reflection"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setEnergyRating(5);
                setFocusRating(5);
                setCompletedTaskIds([]);
                setTasksCompleted(0);
                setHoursSpent(0);
                setAiSummary("");
              }}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Reset
            </button>
          </div>

          {/* Info Text */}
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Your reflection will be used to improve tomorrow's plan and reschedule any uncompleted tasks.
          </p>
        </form>
      </div>
    </div>
  );
}