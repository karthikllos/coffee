// lib/sessionHelper.js
"use client";

/**
 * Force refresh the NextAuth session
 * Call this after updating user data that should appear in the session
 */
export async function refreshSession() {
  try {
    // Trigger NextAuth session refresh
    const event = new Event("visibilitychange");
    document.dispatchEvent(event);
    
    // Alternative: Use the getSession method
    if (typeof window !== 'undefined') {
      const { getSession } = await import('next-auth/react');
      await getSession();
    }
  } catch (error) {
    console.error('[Session] Refresh failed:', error);
  }
}

/**
 * Force complete page reload to refresh session
 * Use this as a fallback when session updates don't propagate
 */
export function forceSessionReload(redirectPath = '/dashboard') {
  if (typeof window !== 'undefined') {
    window.location.href = redirectPath;
  }
}