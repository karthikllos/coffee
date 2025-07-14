"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";

const Navbar = () => {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: "Home", href: "/home" },
    session?.user?.name && {
      label: "About",
      href: `/${session.user.name.replace(/\s+/g, "-").toLowerCase()}`,
    },
    { label: "Contact", href: "/contact" },
    { label: "Login", href: "/login" },
    { label: "Signup", href: "/signup" },
  ].filter(Boolean);

  return (
    <nav className="bg-gray-950 text-white px-6 py-4 shadow-md w-full">
      <div className="flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="logo" width={40} height={40} />
          <h1 className="text-xl font-semibold tracking-wide">Get Me A Coffee</h1>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map(({ label, href }) => {
            if (session && (label === "Login" || label === "Signup")) return null;
            return (
              <li key={label}>
                <Link
                  href={href}
                  className={`transition duration-200 hover:text-yellow-400 ${
                    pathname === href ? "text-yellow-400" : ""
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}

          {session && (
            <li className="flex items-center gap-2">
              <span className="text-sm text-gray-300">
                {session.user?.email || "Logged in"}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                Sign out
              </button>
            </li>
          )}
        </ul>

        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="ml-4 p-2 rounded hover:bg-gray-800 transition duration-200"
          >
            {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}

        {/* Mobile Toggle */}
        <button
          className="md:hidden ml-4 text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="text-lg">☰</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <ul className="md:hidden mt-4 flex flex-col gap-4 text-sm font-medium">
          {navItems.map(({ label, href }) => {
            if (session && (label === "Login" || label === "Signup")) return null;
            return (
              <li key={label}>
                <Link
                  href={href}
                  className={`block py-1 px-2 rounded hover:bg-gray-800 transition duration-200 ${
                    pathname === href ? "text-yellow-400" : ""
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              </li>
            );
          })}

          {session && (
            <li className="flex flex-col gap-1 px-2">
              <span className="text-gray-300">{session.user?.email || "Logged in"}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              >
                Sign out
              </button>
            </li>
          )}
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
