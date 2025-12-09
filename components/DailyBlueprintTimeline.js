"use client";
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Loader2, Save, Plus, Trash2 } from 'lucide-react';

/**
 * DailyBlueprintTimeline component
 * This component displays the unified schedule and allows for routine, assignment, and micro-goal management.
 */
export default function DailyBlueprintTimeline({ blueprintData }) {
  const [blueprint, setBlueprint] = useState(blueprintData || null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [routines, setRoutines] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [microGoals, setMicroGoals] = useState([]);

  useEffect(() => {
    if (blueprintData) {
      setBlueprint(blueprintData);
      setRoutines(blueprintData.routines || []);
      setAssignments(blueprintData.assignments || []);
      setMicroGoals(blueprintData.microGoals || []);
    }
    setLoading(false);
  }, [blueprintData]);

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'slipped': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  const saveBlueprint = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/planner/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routines,
          assignments,
          microGoals,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setBlueprint(data.blueprint);
        console.log("✅ Blueprint saved");
      } else {
        setError(data.error || "Failed to save blueprint");
      }
    } catch (err) {
      setError("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">📋 Daily Blueprint</h1>

      {error && (
        <div className="p-4 rounded bg-red-500/10 text-red-600">{error}</div>
      )}

      {/* Routines Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">🕐 Daily Routines</h2>
        <div className="space-y-2">
          {routines.map((r, idx) => (
            <div key={idx} className="p-3 bg-[var(--input-bg)] rounded flex justify-between items-center">
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {r.startTime} - {r.endTime}
                </p>
              </div>
              <button
                onClick={() => setRoutines(routines.filter((_, i) => i !== idx))}
                className="text-red-500 hover:bg-red-500/10 p-2 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Assignments Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">📚 Assignments</h2>
        <div className="space-y-2">
          {assignments.map((a, idx) => (
            <div key={idx} className="p-3 bg-[var(--input-bg)] rounded flex justify-between items-center">
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-sm text-[var(--text-secondary)]">{a.subject}</p>
              </div>
              <button
                onClick={() => setAssignments(assignments.filter((_, i) => i !== idx))}
                className="text-red-500 hover:bg-red-500/10 p-2 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Micro Goals Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">🎯 Micro Goals</h2>
        <div className="space-y-2">
          {microGoals.map((g, idx) => (
            <div key={idx} className="p-3 bg-[var(--input-bg)] rounded flex justify-between items-center">
              <p className="font-medium">{g.goal}</p>
              <button
                onClick={() => setMicroGoals(microGoals.filter((_, i) => i !== idx))}
                className="text-red-500 hover:bg-red-500/10 p-2 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={saveBlueprint}
        disabled={saving}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving..." : "Save Blueprint"}
      </button>
    </div>
  );
}