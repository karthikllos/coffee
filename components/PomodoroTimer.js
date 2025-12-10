"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";

const FOCUS_SECONDS = 25 * 60;
const SHORT_BREAK_SECONDS = 5 * 60;
const LONG_BREAK_SECONDS = 15 * 60;
const CYCLE_BEFORE_LONG_BREAK = 4;

/**
 * ✅ FIXED: Pomodoro Timer now works independently without requiring taskId
 * - Tracks time locally
 * - Optional task syncing if taskId is provided
 * - Works as standalone focus timer
 */
export default function PomodoroTimer({ taskId, onTimeUpdate }) {
  const [mode, setMode] = useState("focus"); // focus | short | long
  const [remaining, setRemaining] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);

  const unsyncedFocusRef = useRef(0);
  const beepRef = useRef(null);

  const format = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // ✅ Optional sync to task API (only if taskId provided)
  const syncTime = useCallback(
    async (seconds) => {
      if (!taskId || seconds <= 0) {
        // No task linked - just track locally
        setTotalFocusTime(prev => prev + seconds);
        if (onTimeUpdate) {
          onTimeUpdate(seconds);
        }
        return;
      }

      try {
        setIsSyncing(true);
        await fetch("/api/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: taskId,
            actualDurationDelta: seconds / 60,
          }),
        });
        setTotalFocusTime(prev => prev + seconds);
        if (onTimeUpdate) {
          onTimeUpdate(seconds);
        }
      } catch (error) {
        console.error("[Pomodoro] Sync error:", error);
      } finally {
        setIsSyncing(false);
      }
    },
    [taskId, onTimeUpdate]
  );

  const flush = useCallback(async () => {
    const pending = unsyncedFocusRef.current;
    if (pending > 0) {
      unsyncedFocusRef.current = 0;
      await syncTime(pending);
    }
  }, [syncTime]);

  const getSessionDuration = (mode) => {
    if (mode === "focus") return FOCUS_SECONDS;
    if (mode === "long") return LONG_BREAK_SECONDS;
    return SHORT_BREAK_SECONDS;
  };

  const switchMode = useCallback(() => {
    if (mode === "focus") {
      const nextCount = sessionCount + 1;
      setSessionCount(nextCount);

      if (nextCount % CYCLE_BEFORE_LONG_BREAK === 0) {
        setMode("long");
        return LONG_BREAK_SECONDS;
      }

      setMode("short");
      return SHORT_BREAK_SECONDS;
    }

    setMode("focus");
    return FOCUS_SECONDS;
  }, [mode, sessionCount]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (mode === "focus") {
            const leftover = unsyncedFocusRef.current + (prev > 0 ? 1 : 0);
            unsyncedFocusRef.current = 0;
            if (leftover > 0) syncTime(leftover);
          }

          try {
            beepRef.current?.play();
          } catch {}

          return switchMode();
        }

        if (mode === "focus") {
          unsyncedFocusRef.current += 1;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, mode, syncTime, switchMode]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isRunning) {
        setIsRunning(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [isRunning]);

  const toggle = async () => {
    if (isRunning) {
      await flush();
      setIsRunning(false);
    } else {
      setIsRunning(true);
    }
  };

  const reset = async () => {
    await flush();
    setIsRunning(false);
    setMode("focus");
    setRemaining(FOCUS_SECONDS);
    setSessionCount(0);
  };

  const total = getSessionDuration(mode);
  const progress = 1 - remaining / total;
  const isFocus = mode === "focus";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-emerald-500" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Focus Timer
          </h3>
        </div>
        {taskId && (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
            Linked to Task
          </span>
        )}
      </div>

      {/* Timer Display */}
      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative">
          <svg width="200" height="200">
            <circle
              cx="100"
              cy="100"
              r="85"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="100"
              cy="100"
              r="85"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 85}
              strokeDashoffset={(1 - progress) * 2 * Math.PI * 85}
              className={`transition-all duration-500 ${
                isFocus
                  ? "text-emerald-500"
                  : mode === "long"
                  ? "text-purple-500"
                  : "text-blue-500"
              }`}
              strokeLinecap="round"
              style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono text-5xl font-bold text-gray-900 dark:text-white">
              {format(remaining)}
            </div>
            <div
              className={`mt-2 px-4 py-1 rounded-full text-sm font-medium ${
                isFocus
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                  : mode === "long"
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              }`}
            >
              {isFocus ? "Focus Time" : mode === "long" ? "Long Break" : "Short Break"}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {sessionCount}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Sessions Completed
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.floor(totalFocusTime / 60)}m
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Total Focus Time
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={toggle}
          className={`flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all duration-200 ${
            isRunning
              ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
              : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="h-5 w-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Start
            </>
          )}
        </button>

        <button
          onClick={reset}
          className="p-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Reset Timer"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>

      {isSyncing && (
        <div className="mt-4 text-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Syncing time...
          </span>
        </div>
      )}

      {/* Next Break Info */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-center text-gray-600 dark:text-gray-400">
          {sessionCount % CYCLE_BEFORE_LONG_BREAK === CYCLE_BEFORE_LONG_BREAK - 1
            ? "🎉 Next: Long Break (15 min)"
            : `Next: Short Break (5 min) • ${
                CYCLE_BEFORE_LONG_BREAK - (sessionCount % CYCLE_BEFORE_LONG_BREAK) - 1
              } sessions until long break`}
        </p>
      </div>

      {/* Audio beep */}
      <audio
        ref={beepRef}
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA="
      />
    </div>
  );
}