"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Moon, Sun, Users, CreditCard, ChevronDown, Sparkles, Brain, Zap, Crown, Star } from "lucide-react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import CreditBadge from "./CreditBadge";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [aiDropdownOpen, setAiDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session, status, update } = useSession();

  useEffect(() => {
    setMounted(true);
    
    // Auto-refresh session every 30 seconds to catch subscription updates
    const interval = setInterval(() => {
      if (status === "authenticated") {
        update();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [status, update]);

  const navItems = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/faq" },
  ];

  const authenticatedNavItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Study Groups", href: "/groups", icon: Users },
  ];

  const proFeatures = [
    { label: "AI Notes", href: "/ai/notes", icon: Sparkles, description: "1 credit per use" },
    { label: "AI Quiz", href: "/ai/quiz", icon: Brain, description: "2 credits per use" },
  ];

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  // ✅ Check subscription from session with fallback
  const userPlan = session?.user?.subscriptionPlan || "Free";
  const isPro = userPlan && ["Pro", "Premium", "Pro Max", "Starter"].includes(userPlan);

  // Get plan display details
  const getPlanIcon = (plan) => {
    switch(plan) {
      case "Premium":
      case "Pro Max":
        return <Crown className="h-4 w-4" />;
      case "Pro":
        return <Star className="h-4 w-4" />;
      case "Starter":
        return <Zap className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getPlanColor = (plan) => {
    switch(plan) {
      case "Premium":
      case "Pro Max":
        return "from-purple-500 to-pink-500";
      case "Pro":
        return "from-emerald-500 to-teal-500";
      case "Starter":
        return "from-blue-500 to-cyan-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  return (
    <nav className="w-full text-[color:var(--foreground)] px-6 py-4 shadow-md bg-[var(--background)] border-b border-[color:var(--accent-border)]">
      <div className="flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="StudySync Daily logo" width={40} height={40} />
          <h1 className="text-xl font-semibold tracking-wide">
            <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
              StudySync Daily
            </span>
          </h1>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {/* Navigation Links */}
          <ul className="flex items-center gap-6">
            {(session ? authenticatedNavItems : navItems).map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <Link
                  href={href}
                  className={`flex items-center gap-2 transition duration-200 hover:text-[color:var(--accent-solid)] ${
                    pathname === href ? "text-[color:var(--accent-solid)]" : "text-[color:var(--muted)]"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* ✅ AI Tools Dropdown - Show for all paid plans */}
          {session && isPro && (
            <div className="relative">
              <button
                onClick={() => setAiDropdownOpen(!aiDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition duration-200 ${
                  aiDropdownOpen
                    ? "text-[color:var(--accent-solid)] bg-[var(--card-bg)]"
                    : "text-[color:var(--muted)] hover:text-[color:var(--accent-solid)] hover:bg-[var(--card-bg)]"
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>AI Tools</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    aiDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* AI Features Dropdown Menu */}
              {aiDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg z-50 min-w-72 animate-in fade-in slide-in-from-top-2">
                  <div className="p-2">
                    {proFeatures.map(({ label, href, icon: Icon, description }) => (
                      <Link
                        key={label}
                        href={href}
                        className={`flex items-start gap-3 px-4 py-3 rounded-lg transition duration-200 ${
                          pathname === href
                            ? "bg-[var(--button-hover)] text-[color:var(--accent-solid)]"
                            : "hover:bg-[var(--button-hover)] text-[color:var(--foreground)]"
                        }`}
                        onClick={() => setAiDropdownOpen(false)}
                      >
                        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{label}</p>
                          <p className="text-xs text-[color:var(--text-tertiary)] mt-1">
                            {description}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Authenticated user section */}
          {session ? (
            <div className="flex items-center gap-3 relative">
              {/* ✅ CURRENT PLAN BADGE */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r ${getPlanColor(userPlan)} text-white shadow-lg hover:shadow-xl transition-all duration-200`}>
                {getPlanIcon(userPlan)}
                <span className="text-sm font-bold">{userPlan}</span>
              </div>

              {/* ✅ UPGRADE BUTTON for Free/Starter users */}
              {(userPlan === "Free" || userPlan === "Starter") && (
                <Link
                  href="/pricing"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold text-sm hover:shadow-lg transition-all duration-200 hover:scale-105 animate-pulse"
                >
                  ⚡ Upgrade
                </Link>
              )}

              {/* User Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[color:var(--muted)]">
                  {session.user?.username || session.user?.email || "Account"}
                </span>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`p-2 rounded transition duration-200 flex items-center ${
                    dropdownOpen 
                      ? "bg-[var(--button-hover)]" 
                      : "hover:bg-[var(--button-hover)]"
                  }`}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform duration-200 ${
                      dropdownOpen ? "rotate-180" : ""
                    }`} 
                  />
                </button>
              </div>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg z-50 min-w-48 animate-in fade-in slide-in-from-top-2">
                  {/* Plan Badge */}
                  <div className="px-4 py-3 border-b border-[var(--card-border)]">
                    <p className="text-xs text-[color:var(--text-tertiary)] uppercase tracking-wide">Current Plan</p>
                    <div className={`flex items-center gap-2 mt-1 text-sm font-bold bg-gradient-to-r ${getPlanColor(userPlan)} bg-clip-text text-transparent`}>
                      {getPlanIcon(userPlan)}
                      <span>{userPlan}</span>
                    </div>
                  </div>

                  {/* Upgrade Link (for non-premium users) */}
                  {(userPlan === "Free" || userPlan === "Starter" || userPlan === "Pro") && (
                    <Link
                      href="/pricing"
                      className="flex items-center gap-2 px-4 py-3 hover:bg-[var(--button-hover)] transition duration-200 border-b border-[var(--card-border)] text-[color:var(--foreground)] hover:text-[color:var(--accent-solid)] font-semibold"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Crown className="h-4 w-4" />
                      <span>Upgrade Plan</span>
                    </Link>
                  )}

                  {/* Billing Link */}
                  <Link
                    href="/account/billing"
                    className="flex items-center gap-2 px-4 py-3 hover:bg-[var(--button-hover)] transition duration-200 border-b border-[var(--card-border)] text-[color:var(--foreground)] hover:text-[color:var(--accent-solid)]"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Billing & Invoices</span>
                  </Link>

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "/auth" });
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-[var(--button-hover)] transition duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth"
                className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Credit Badge */}
          {session && mounted && <CreditBadge />}

          {/* Theme Toggle */}
          {mounted && (
            <button
              aria-label="Toggle theme"
              onClick={handleThemeToggle}
              className="p-2 rounded hover:bg-[var(--button-hover)] transition duration-200 border border-[color:var(--accent-border)]"
              title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-[color:var(--foreground)] hover:bg-[var(--button-hover)] rounded transition" 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className="text-lg">☰</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
          {/* Navigation Links */}
          <ul className="flex flex-col gap-4 text-sm font-medium">
            {(session ? authenticatedNavItems : navItems).map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <Link
                  href={href}
                  className={`flex items-center gap-2 block py-2 px-3 rounded-lg hover:bg-[var(--card-bg)] transition duration-200 ${
                    pathname === href 
                      ? "text-[color:var(--accent-solid)] bg-[var(--card-bg)]" 
                      : "text-[color:var(--text-secondary)]"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* AI Tools Mobile */}
          {session && isPro && (
            <div className="border-t border-[var(--card-border)] pt-4">
              <p className="text-xs text-[color:var(--text-tertiary)] uppercase tracking-wide px-3 mb-3 font-semibold">AI Tools</p>
              <ul className="flex flex-col gap-2">
                {proFeatures.map(({ label, href, icon: Icon, description }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className={`flex items-start gap-3 py-3 px-3 rounded-lg transition duration-200 ${
                        pathname === href
                          ? "text-[color:var(--accent-solid)] bg-[var(--card-bg)]"
                          : "text-[color:var(--text-secondary)] hover:bg-[var(--card-bg)]"
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{label}</p>
                        <p className="text-xs text-[color:var(--text-tertiary)] mt-1">
                          {description}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mobile Auth */}
          <div className="flex flex-col gap-3 px-2 border-t border-[var(--card-border)] pt-4">
            {session ? (
              <>
                {/* Current Plan Display */}
                <div className="px-3 py-2">
                  <p className="text-xs text-[color:var(--text-tertiary)] uppercase">Current Plan</p>
                  <div className={`flex items-center gap-2 mt-1 text-sm font-bold bg-gradient-to-r ${getPlanColor(userPlan)} bg-clip-text text-transparent`}>
                    {getPlanIcon(userPlan)}
                    <span>{userPlan}</span>
                  </div>
                </div>

                {/* Account Info */}
                <div className="px-3 py-2">
                  <p className="text-xs text-[color:var(--text-tertiary)] uppercase">Account</p>
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">
                    {session.user?.username || session.user?.email}
                  </p>
                </div>

                {/* Upgrade (if applicable) */}
                {(userPlan === "Free" || userPlan === "Starter") && (
                  <Link
                    href="/pricing"
                    className="px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    ⚡ Upgrade to Premium
                  </Link>
                )}

                {/* Billing */}
                <Link
                  href="/account/billing"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[var(--card-bg)] hover:bg-[var(--button-hover)] transition duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Billing & Invoices</span>
                </Link>

                {/* Sign Out */}
                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/auth" });
                    setMenuOpen(false);
                  }}
                  className="px-4 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="px-4 py-3 rounded-lg bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] text-white font-medium text-center"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Admin Analytics Link - Only for admin users */}
      {session?.user?.isAdmin && (
        <div className="mt-4 px-6">
          <Link
            href="/admin/analytics"
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[var(--card-bg)] hover:bg-[var(--button-hover)] transition duration-200 text-sm font-medium"
          >
            <span className="text-lg">📊</span>
            <span>Admin Analytics</span>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;