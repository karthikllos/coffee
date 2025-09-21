"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react"; // ✅ Import real NextAuth signIn

// Keep your toast function
const toast = {
  error: (message) => console.error(message),
};

// ❌ REMOVED: Mock signIn function - using real NextAuth signIn now

export default function AuthPage() {
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState("login");
  const [isHydrated, setIsHydrated] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    setIsHydrated(true);
    const error = searchParams.get("error");
    if (error) {
      const message =
        error === "AccessDenied"
          ? "Access denied by provider. Please ensure you granted email access."
          : error === "OAuthAccountNotLinked"
          ? "This email is already linked with another provider. Please use the original provider."
          : "Sign-in failed. Please try again.";
      toast.error(message);
    }
  }, [searchParams]);

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-8 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('image.jpg')`,
            filter: "brightness(1.05) contrast(1)",
          }}
        />

        {/* Dark gradient overlay for readability */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.3) 100%)`,
          }}
        />

        {/* Subtle vignette for depth */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, rgba(0,0,0,0.25) 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Left Side - Animated Typography */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-start pl-12 pr-8 relative z-10">
        <div className="space-y-6">
          {/* Large animated text */}
          <div className="space-y-2">
            <h1
              className="text-8xl font-black uppercase tracking-tight leading-none transition-all duration-1000 hover:scale-105"
              style={{
                backgroundImage:
                  mode === "login"
                    ? `linear-gradient(135deg, var(--accent-from, #10b981), var(--accent-to, #059669), #6366f1)`
                    : `linear-gradient(135deg, #8b5cf6, var(--accent-from, #10b981), var(--accent-to, #059669))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                textShadow: "0 0 40px rgba(16,185,129,0.3)",
                transform: "translateY(0px)",
                animation: "float 6s ease-in-out infinite",
              }}
            >
              {mode === "login" ? "LOGIN" : "SIGNUP"}
            </h1>
            <div
              className="text-6xl font-black uppercase tracking-tight opacity-60"
              style={{
                backgroundImage: `linear-gradient(135deg, var(--muted, #64748b), var(--accent-from, #10b981))`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                transform: "translateY(0px)",
                animation: "float 6s ease-in-out infinite 0.5s",
              }}
            >
              {mode === "login" ? "SIGN IN" : "SIGN UP"}
            </div>
          </div>

          {/* Animated decorative elements */}
          <div className="flex items-center space-x-4 mt-8">
            <div
              className="w-16 h-1 rounded-full animate-pulse"
              style={{
                backgroundImage: `linear-gradient(90deg, var(--accent-from, #10b981), var(--accent-to, #059669))`,
                animationDuration: "2s",
              }}
            />
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center animate-spin"
              style={{
                backgroundImage: `conic-gradient(from 0deg, var(--accent-from, #10b981), var(--accent-to, #059669), var(--accent-from, #10b981))`,
                animationDuration: "10s",
              }}
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
                style={{ backgroundColor: "rgba(0,0,0, 0.95)" }}
              >
                @
              </div>
            </div>
          </div>

          {/* Mode indicator */}
          <p
            className="text-xl font-medium backdrop-blur-sm bg-white bg-opacity-20 px-4 py-2 rounded-lg"
            style={{
              color: "var(--muted, #e2e8f0)",
              animation: "fadeIn 1s ease-out",
            }}
          >
            {mode === "login"
              ? "Welcome back! Ready to continue your journey?"
              : "Join our community and start your adventure!"}
          </p>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="relative backdrop-blur-xl p-8 rounded-3xl shadow-2xl border transition-all duration-500 hover:shadow-3xl group bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white">
        <section
          className="relative backdrop-blur-xl p-8 rounded-3xl shadow-2xl border transition-all duration-500 hover:shadow-3xl group"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "rgba(255, 255, 255, 0.3)",
            color: "var(--foreground)",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.2)",
            backdropFilter: "blur(25px)",
          }}
        >
          {/* Gradient accent bar with animation */}
          <div
            className="absolute top-0 left-0 right-0 h-2 rounded-t-3xl transition-all duration-500 group-hover:h-3"
            style={{
              backgroundImage: `linear-gradient(135deg, var(--accent-from, #10b981), var(--accent-to, #059669), #8b5cf6)`,
            }}
          />

          {/* Floating mode indicator */}
          <div className="flex justify-center mb-6 pt-4">
            <div
              className="relative flex bg-opacity-60 rounded-2xl p-2 border shadow-lg backdrop-blur-sm"
              style={{
                backgroundColor: "rgba(241, 245, 249, 0.9)",
                borderColor: "rgba(255, 255, 255, 0.4)",
              }}
            >
              <button
                onClick={() => setMode("login")}
                className={`relative z-10 px-6 py-2 rounded-xl font-medium text-sm transition-all duration-300 focus:outline-none ${
                  mode === "login"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white scale-105"
                    : "bg-transparent text-gray-600 hover:bg-white hover:bg-opacity-70 hover:text-gray-800"
                }`}
              >
                Login
              </button>

              <button
                onClick={() => setMode("signup")}
                className={`relative z-10 px-6 py-2 rounded-xl font-medium text-sm transition-all duration-300 focus:outline-none ${
                  mode === "signup"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                    : "bg-transparent text-gray-600 hover:bg-white hover:bg-opacity-70 hover:text-gray-800"
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Header with smooth transitions */}
            <div className="text-center space-y-3">
              <h2
                className="text-2xl font-bold transition-all duration-500"
                style={
                  isHydrated
                    ? {
                        backgroundImage: `linear-gradient(135deg, var(--accent-from, #10b981), var(--accent-to, #059669))`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }
                    : {
                        color: "#10b981",
                      }
                }
              >
                {mode === "login" ? "Welcome Back!" : "Create Your Page"}
              </h2>
              <p className="text-sm text-gray-300">
                {mode === "login"
                  ? "Choose your preferred method to continue"
                  : "Pick a unique username to receive support"}
              </p>
            </div>

            {/* Username field with smooth slide animation */}
            <div
              className="transition-all duration-500 overflow-hidden"
              style={{
                maxHeight: mode === "signup" ? "100px" : "0px",
                opacity: mode === "signup" ? 1 : 0,
                marginTop: mode === "signup" ? "1.5rem" : "0rem",
              }}
            >
              <div className="space-y-3">
                <label className="text-sm font-medium block text-gray-200">
                  Username
                </label>
                <div className="relative">
                  <input
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value.replace(/\s+/g, "").toLowerCase()
                      )
                    }
                    className="w-full border-2 rounded-xl px-4 py-3 pl-10 transition-all duration-300 focus:outline-none focus:ring-4 focus:border-transparent bg-white bg-opacity-90 border-gray-200 text-gray-800 focus:ring-emerald-200"
                    placeholder="e.g. johndoe"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg text-gray-500">
                    @
                  </div>
                </div>
              </div>
            </div>

            {/* OAuth Buttons with enhanced styling */}
            <div className="space-y-4 pt-2">
              <button
                onClick={() => signIn("google")}
                className="w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:scale-105 border group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-transparent"
                style={{
                  boxShadow: "0 8px 25px rgba(16,185,129,0.3)",
                }}
              >
                <span className="relative z-10 flex items-center justify-center space-x-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:animate-shimmer" />
              </button>

              <button
                onClick={() => signIn("github")}
                className="w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2 group bg-white bg-opacity-90 text-gray-800 border-gray-200"
              >
                <span className="flex items-center justify-center space-x-3">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <span>Continue with GitHub</span>
                </span>
              </button>

              <button
                onClick={() => signIn("linkedin")}
                className="w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2 group bg-white bg-opacity-70 text-gray-800 border-gray-200 border-opacity-50"
              >
                <span className="flex items-center justify-center space-x-3">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.924 2.065-2.064 2.065zm1.781 13.019H3.555V9h3.563v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.225.792 24 1.771 24h20.451C23.2 24 24 23.225 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
                  </svg>
                  <span>Continue with LinkedIn</span>
                </span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
      `}</style>
    </main>
  );
}