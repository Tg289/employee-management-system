"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleSignout = async () => {
    try {
      setLoading(true);
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      console.error("Signout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSignout}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-slate-800 rounded-md text-xs font-semibold text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/20 focus:outline-none focus:ring-1 focus:ring-rose-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
      ) : (
        <>
          <LogOut className="h-3.5 w-3.5" />
          <span>Exit Account</span>
        </>
      )}
    </button>
  );
}
