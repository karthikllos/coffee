"use client";

import { Bell, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function TaskCard({ task }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const sendReminder = async () => {
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/notifications/task-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task._id,
          title: task.title,
          dueDate: task.dueDate,
          customSubject: `Task Reminder: ${task.title}`,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSent(true);
        console.log("✅ Reminder sent:", data.message);
        // Reset after 3 seconds
        setTimeout(() => setSent(false), 3000);
      } else {
        setError(data.error || "Failed to send reminder");
        console.error("❌ Failed:", data.error);
      }
    } catch (err) {
      setError("Error sending reminder: " + err.message);
      console.error("Error:", err);
    } finally {
      setSending(false);
    }
  };

  const isOverdue = new Date(task.dueDate) < new Date() && !task.completed;
  const isDueSoon =
    new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000) &&
    !isOverdue &&
    !task.completed;

  return (
    <div
      className={`card border-l-4 ${
        isOverdue
          ? "border-red-500 bg-red-500/5"
          : isDueSoon
          ? "border-yellow-500 bg-yellow-500/5"
          : "border-blue-500"
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{task.title}</h3>
            {isOverdue && (
              <span className="px-2 py-1 text-xs font-bold bg-red-500 text-white rounded">
                OVERDUE
              </span>
            )}
            {isDueSoon && !isOverdue && (
              <span className="px-2 py-1 text-xs font-bold bg-yellow-500 text-white rounded">
                DUE SOON
              </span>
            )}
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            📅 Due: {new Date(task.dueDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </p>
          {task.description && (
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {task.description}
            </p>
          )}
        </div>

        <button
          onClick={sendReminder}
          disabled={sending || sent || task.completed}
          className={`flex-shrink-0 btn-secondary flex items-center gap-2 transition ${
            sent ? "bg-green-500/20 text-green-600" : ""
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={
            task.completed
              ? "Task completed"
              : "Send me a reminder email for this task"
          }
        >
          <Bell className="h-4 w-4" />
          <span className="text-sm">
            {sent ? "Sent! ✓" : sending ? "Sending..." : "Remind"}
          </span>
        </button>
      </div>

      {error && (
        <div className="mt-3 p-2 rounded bg-red-500/10 border border-red-500/30 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

// In your main app initialization (pages/_app.js or app layout):
// import { initTaskReminderCron } from '@/lib/cronJobs';
// initTaskReminderCron();