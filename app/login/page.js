"use client";
import React from "react";
import { signIn } from "next-auth/react";

const providers = [
  {
    name: "Google",
    color: "#EA4335",
    id: "google",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.6 0 6.1 1.6 7.5 2.9l5.5-5.3C33.7 3.1 29.2 1 24 1 14.9 1 7.3 6.6 3.9 14l6.7 5.2C12.4 13.8 17.7 9.5 24 9.5z" />
        <path fill="#34A853" d="M24 46.6c5.6 0 10.4-1.8 13.9-5l-6.5-5.3c-2 1.5-4.8 2.4-7.4 2.4-6.4 0-11.8-4.3-13.7-10.1L3.7 33.6C7.1 41.2 14.9 46.6 24 46.6z" />
        <path fill="#FBBC05" d="M10.3 28.6c-.5-1.4-.7-2.9-.7-4.6s.3-3.2.7-4.6l-6.6-5.2C2.4 17.1 1 20.4 1 24s1.4 6.9 3.7 9.8l6.6-5.2z" />
        <path fill="#4285F4" d="M24 18.3c2.6 0 4.3 1.1 5.3 2l4.3-4.2C31.9 13 28.5 11 24 11c-6.3 0-11.6 4.3-13.4 10.1l6.7 5.2C18.3 20.3 20.9 18.3 24 18.3z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    color: "#0077B5",
    id: "linkedin",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4V24h-4V8zM8.5 8h3.5v2.3h.05c.49-.93 1.69-1.9 3.45-1.9 3.69 0 4.5 2.43 4.5 5.59V24h-4v-8.29c0-1.98-.04-4.52-2.75-4.52-2.75 0-3.17 2.15-3.17 4.37V24h-4V8z" />
      </svg>
    ),
  },
  {
    name: "GitHub",
    color: "#333333",
    id: "github",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.38 0 0 5.38 0 12a12 12 0 008.21 11.42c.6.1.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.42-1.34-1.8-1.34-1.8-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.26 1.86 1.26 1.08 1.85 2.84 1.32 3.54 1.01.11-.78.42-1.32.76-1.62-2.66-.3-5.47-1.34-5.47-5.97 0-1.32.47-2.4 1.24-3.25-.12-.3-.54-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 016 0c2.3-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.85 1.24 1.93 1.24 3.25 0 4.64-2.81 5.67-5.49 5.97.43.38.82 1.12.82 2.26v3.35c0 .32.22.68.82.58A12 12 0 0024 12c0-6.62-5.38-12-12-12z" />
      </svg>
    ),
  },
];

const Login = () => {
  return (
    <div className="relative min-h-screen flex flex-col items-center bg-gray-100 overflow-hidden px-6 py-12">
      {/* 🌌 Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_20%,#0f172a_0%,#020617_100%)]" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f22_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f22_1px,transparent_1px)] bg-[size:14px_24px] opacity-10" />

      {/* Content */}
      <div className="z-10 text-center max-w-sm w-full space-y-6">
        <h1 className="text-xl font-bold text-white">
          Login to Share Your Friends A Chai!!
        </h1>

        {providers.map((provider) => (
          <button
            key={provider.id}
            onClick={() => signIn(provider.id)}
            className="flex items-center justify-start w-full gap-3 px-6 py-2 bg-white border border-gray-300 rounded-lg shadow-md text-sm font-medium text-gray-800 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
          >
            <span className="text-lg" style={{ color: provider.color }}>
              {provider.icon}
            </span>
            <span className="text-xl font-bold">Continue with {provider.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Login;
