"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Calendar,
  PlusCircle,
  BarChart3,
  Clock,
  Activity,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import TaskForm from "../../components/TaskForm";
import ReflectionForm from "../../components/ReflectionForm";
import DailyBlueprintTimeline from "../../components/DailyBlueprintTimeline";
import PomodoroTimer from "../../components/PomodoroTimer";

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("blueprint");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [blueprint, setBlueprint] = useState(null);
  const [focusPrediction, setFocusPrediction] = useState(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [stats, setStats] = useState({
    tasksDueToday: 0,
    tasksCompleted: 0,
    tasksTotal: 0,
    studyStreak: 0,
    hoursPlannedThisWeek: 0,
    hoursCompletedThisWeek: 0,
    routinesActive: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }
    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    console.log("[Dashboard] 🔄 Fetching dashboard data...");
    
    try {
      setLoading(true);

      // Fetch student profile data
      let studentProfileData = null;
      try {
        const profileResponse = await fetch("/api/user/academic-profile");
        if (profileResponse.ok) {
          studentProfileData = await profileResponse.json();
          setProfile(studentProfileData);
          console.log("[Dashboard] ✅ Profile fetched:", studentProfileData);
        }
      } catch (err) {
        console.warn("[Dashboard] ⚠️ Profile fetch failed:", err);
      }

      // Fetch tasks
      let tasksData = [];
      try {
        const tasksResponse = await fetch("/api/tasks");
        if (tasksResponse.ok) {
          const tasksResponseData = await tasksResponse.json();
          tasksData = Array.isArray(tasksResponseData) 
            ? tasksResponseData 
            : tasksResponseData.tasks || [];
          setTasks(tasksData);
          console.log("[Dashboard] ✅ Tasks fetched:", tasksData.length);
        }
      } catch (err) {
        console.warn("[Dashboard] ⚠️ Tasks fetch failed:", err);
      }

      // Fetch routines
      let routinesData = [];
      try {
        const routinesResponse = await fetch("/api/routines");
        if (routinesResponse.ok) {
          const routinesResponseData = await routinesResponse.json();
          routinesData = Array.isArray(routinesResponseData) 
            ? routinesResponseData 
            : routinesResponseData.routines || [];
          setRoutines(routinesData);
          console.log("[Dashboard] ✅ Routines fetched:", routinesData.length);
        }
      } catch (err) {
        console.warn("[Dashboard] ⚠️ Routines fetch failed:", err);
      }

      // Fetch daily blueprint
      try {
        const blueprintResponse = await fetch("/api/planner/blueprint");
        if (blueprintResponse.ok) {
          const blueprintData = await blueprintResponse.json();
          setBlueprint(blueprintData);
          console.log("[Dashboard] ✅ Blueprint fetched");
        }
      } catch (err) {
        console.warn("[Dashboard] ⚠️ Blueprint fetch failed:", err);
      }

      // Fetch predictive focus score
      try {
        const focusResponse = await fetch("/api/ai/predict");
        if (focusResponse.ok) {
          const focusData = await focusResponse.json();
          setFocusPrediction(focusData);
          console.log("[Dashboard] ✅ Focus prediction fetched");
        }
      } catch (err) {
        console.warn("[Dashboard] ⚠️ Focus prediction failed:", err);
      }

      // Calculate statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // Tasks due today
      const tasksDueToday = tasksData.filter((t) => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate <= todayEnd;
      }).length;

      // Completed tasks
      const tasksCompleted = tasksData.filter((t) => t.isCompleted || t.completed).length;

      // Total tasks
      const tasksTotal = tasksData.length;

      // Study streak (from profile)
      const studyStreak = studentProfileData?.studyStreak ?? 0;

      // Weekly hours (from profile or calculate from tasks)
      const hoursPlannedThisWeek = studentProfileData?.academicProfile?.targetHoursPerWeek ?? 0;
      
      // Calculate hours completed this week from tasks
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const hoursCompletedThisWeek = tasksData
        .filter((t) => {
          if (!t.isCompleted && !t.completed) return false;
          const completedDate = t.completedAt ? new Date(t.completedAt) : new Date(t.updatedAt);
          return completedDate >= weekStart && completedDate < weekEnd;
        })
        .reduce((sum, t) => sum + ((t.actualDuration || t.estimatedDuration || 0) / 60), 0);

      // Active routines (count unique days)
      const routinesActive = routinesData.length;

      const calculatedStats = {
        tasksDueToday,
        tasksCompleted,
        tasksTotal,
        studyStreak,
        hoursPlannedThisWeek,
        hoursCompletedThisWeek: Math.round(hoursCompletedThisWeek * 10) / 10,
        routinesActive,
      };

      setStats(calculatedStats);
      console.log("[Dashboard] ✅ Stats calculated:", calculatedStats);

    } catch (error) {
      console.error("[Dashboard] ❌ Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/${session?.user?.username}`;
    navigator.clipboard.writeText(profileUrl);
    alert("Profile link copied to clipboard!");
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-x-2">
          <Loader2 className="animate-spin h-8 w-8 text-emerald-500 mb-4" />
          <span className="text-gray-600 dark:text-gray-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "blueprint", label: "Blueprint", icon: Calendar },
    { id: "tasks", label: "Tasks", icon: PlusCircle },
    { id: "stats", label: "Stats", icon: BarChart3 },
  ];

  const StatCard = ({ title, value, subtitle, icon: Icon, color = "emerald" }) => {
    const colorClasses = {
      emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
      blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
      purple: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
      orange: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30",
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className={`text-3xl font-bold mt-2 ${colorClasses[color]?.split(" ").slice(0, 4).join(" ")}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    );
  };

  const renderBlueprint = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              Welcome, {profile?.name || session?.user?.name || session?.user?.username}!
            </h1>
            <p className="text-emerald-100 text-lg">
              Your daily StudySync Blueprint to plan and track study sessions.
            </p>
          </div>
          <div className="hidden md:block flex-shrink-0">
            <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4">
              <Activity className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <button
            onClick={() => setActiveTab("tasks")}
            className="bg-white/20 backdrop-blur-lg px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
          >
            <PlusCircle className="h-5 w-5" />
            Add Task
          </button>
          <button
            onClick={() => setShowReflectionModal(true)}
            className="bg-white/20 backdrop-blur-lg px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
          >
            <MessageSquare className="h-5 w-5" />
            Evening Reflection
          </button>
          <button
            onClick={copyProfileLink}
            className="bg-white/20 backdrop-blur-lg px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
          >
            <Clock className="h-5 w-5" />
            Share Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tasks Due Today"
          value={stats.tasksDueToday}
          subtitle={`${stats.tasksTotal} total tasks`}
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title="Completed Tasks"
          value={`${stats.tasksCompleted}/${stats.tasksTotal}`}
          subtitle={`${stats.tasksTotal > 0 ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) : 0}% completion rate`}
          icon={CheckCircle2}
          color="blue"
        />
        <StatCard
          title="Study Streak"
          value={`${stats.studyStreak} day${stats.studyStreak === 1 ? "" : "s"}`}
          subtitle="Keep it going!"
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="Weekly Hours"
          value={`${stats.hoursCompletedThisWeek}h`}
          subtitle={`Target: ${stats.hoursPlannedThisWeek}h`}
          icon={Clock}
          color="orange"
        />
      </div>

      {/* Predictive Focus Score */}
      {focusPrediction && Array.isArray(focusPrediction.hours) && focusPrediction.hours.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Predictive Focus Score (next 24h)
            </p>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              Baseline: {focusPrediction.baseline ?? "--"}/100
            </span>
          </div>
          <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400"
              style={{
                width: `${Math.max(10, Math.min(100, focusPrediction.baseline ?? 60))}%`,
              }}
            />
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Higher scores suggest better focus windows. Plan deep work near your peak hours.
          </p>
        </div>
      )}

      {/* Daily Blueprint Timeline */}
      {blueprint ? (
        <DailyBlueprintTimeline blueprint={blueprint} />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No blueprint generated yet. Add tasks and routines to get started!
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Task or Routine
          </h2>
          <button
            onClick={() => setShowTaskForm(!showTaskForm)}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition"
          >
            {showTaskForm ? "Hide Form" : "Show Form"}
          </button>
        </div>
        {showTaskForm && (
          <TaskForm
            onSuccess={() => {
              setShowTaskForm(false);
              fetchDashboardData();
            }}
          />
        )}
      </div>

      {/* Tasks List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Academic Tasks ({tasks.length})
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {stats.tasksCompleted} completed • {stats.tasksDueToday} due today
          </div>
        </div>
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <PlusCircle className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No tasks yet. Create your first task to get started!
            </p>
            <button
              onClick={() => setShowTaskForm(true)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-medium"
            >
              Create Task
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => {
              const isCompleted = t.isCompleted || t.completed;
              const dueDate = t.dueDate ? new Date(t.dueDate) : null;
              const isOverdue = dueDate && dueDate < new Date() && !isCompleted;

              return (
                <div
                  key={t._id || t.id}
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    isCompleted
                      ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                      : isOverdue
                      ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
                      : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        {isCompleted && (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4
                            className={`font-semibold text-gray-900 dark:text-white ${
                              isCompleted ? "line-through" : ""
                            }`}
                          >
                            {t.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {t.subject || "No subject"}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                            <span className={isOverdue ? "text-red-600 font-semibold" : "text-gray-500"}>
                              Due: {dueDate ? dueDate.toLocaleDateString() : "No due date"}
                            </span>
                            {t.estimatedDuration && (
                              <span className="text-gray-500">
                                Est: {t.estimatedDuration} min
                              </span>
                            )}
                            {t.actualDuration > 0 && (
                              <span className="text-emerald-600 font-semibold">
                                Spent: {Math.round(t.actualDuration)} min
                              </span>
                            )}
                          </div>
                          <div className="mt-3">
                            <PomodoroTimer taskId={t._id || t.id} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-3 py-1 text-xs rounded-full font-semibold ${
                          isCompleted
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {t.type || "task"}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-bold ${
                          t.priority >= 4
                            ? "bg-red-100 text-red-700"
                            : t.priority >= 3
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        P{t.priority || 3}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Routines List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Recurring Routines ({routines.length})
          </h3>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {stats.routinesActive} active
          </div>
        </div>
        {routines.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No routines set up yet. Create routines for recurring activities!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {routines.map((r) => {
              const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              const days = Array.isArray(r.daysOfWeek)
                ? r.daysOfWeek.map((d) => dayNames[d]).join(", ")
                : "N/A";

              return (
                <div
                  key={r._id || r.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{r.name}</h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                        <p>⏰ {r.startTime} • {r.duration} minutes</p>
                        <p>📅 {days}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full flex-shrink-0 font-semibold">
                      {r.type || "routine"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Study Analytics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Tasks"
            value={stats.tasksTotal}
            subtitle={`${stats.tasksCompleted} completed`}
            icon={PlusCircle}
            color="emerald"
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.tasksTotal > 0 ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) : 0}%`}
            subtitle="Overall performance"
            icon={CheckCircle2}
            color="blue"
          />
          <StatCard
            title="Study Streak"
            value={`${stats.studyStreak} day${stats.studyStreak === 1 ? "" : "s"}`}
            subtitle="Keep it going!"
            icon={Activity}
            color="purple"
          />
          <StatCard
            title="Hours This Week"
            value={`${stats.hoursCompletedThisWeek}h`}
            subtitle={`Goal: ${stats.hoursPlannedThisWeek}h`}
            icon={Clock}
            color="orange"
          />
          <StatCard
            title="Active Routines"
            value={stats.routinesActive}
            subtitle="Recurring activities"
            icon={Calendar}
            color="emerald"
          />
          <StatCard
            title="Tasks Due Today"
            value={stats.tasksDueToday}
            subtitle="Focus for today"
            icon={AlertCircle}
            color="blue"
          />
        </div>

        <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700 mt-6">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
            More analytics coming soon
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Keep completing daily reflections to unlock deeper insights into your focus patterns and
            study habits.
          </p>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "blueprint":
        return renderBlueprint();
      case "tasks":
        return renderTasks();
      case "stats":
        return renderStats();
      default:
        return renderBlueprint();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="relative w-10 h-10 flex-shrink-0">
                {session?.user?.profilepic || profile?.profilepic ? (
                  <Image
                    src={session.user.profilepic || profile.profilepic}
                    alt="Profile"
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">StudySync Blueprint</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">@{session?.user?.username}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => fetchDashboardData()}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                title="Refresh data"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <Link
                href={`/${session?.user?.username}`}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">View Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {renderTabContent()}
      </div>

      {/* Reflection Modal */}
      {showReflectionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Evening Reflection</h2>
                <button
                  onClick={() => setShowReflectionModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
                >
                  ✕
                </button>
              </div>
              <ReflectionForm
                date={new Date()}
                onSuccess={() => {
                  setShowReflectionModal(false);
                  fetchDashboardData();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}