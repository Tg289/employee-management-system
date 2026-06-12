import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { LogOut, Users, BarChart3, ShieldCheck, Clock } from "lucide-react";
import SidebarLink from "@/components/SidebarLink";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const userEmail = session.user?.email || "admin@company.com";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar - Persistent Desktop, Collapsible/Horizontal on mobile */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-slate-800">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-slate-800/60 bg-slate-950/20">
          <div className="p-1 px-1.5 bg-indigo-600 rounded text-indigo-50 font-black text-sm tracking-tight">
            CORE
          </div>
          <div>
            <h1 className="font-bold text-sm text-white tracking-wide">Enterprise EMS</h1>
            <p className="text-[10px] text-slate-500 font-mono">ROLE: ADMINISTRATOR</p>
          </div>
        </div>

        {/* Navigation Options */}
        <nav className="flex-1 p-4 space-y-1.5 flex flex-col justify-start">
          <SidebarLink href="/dashboard" icon={<BarChart3 className="h-4 w-4" />}>
            Analytics Dashboard
          </SidebarLink>
          <SidebarLink href="/dashboard/employees" icon={<Users className="h-4 w-4" />}>
            Employee Directory
          </SidebarLink>
        </nav>

        {/* Administrator account card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30 flex flex-col gap-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="h-8 w-8 bg-indigo-700/85 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-indigo-500/30 shrink-0">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-100 truncate">{userEmail}</p>
              <p className="text-[10px] text-indigo-400 font-medium">System Manager</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Section Canvas */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>SECURE BACKEND ENCRYPTED DEPLOYMENT</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 font-mono uppercase bg-slate-100 px-2.5 py-1 rounded">
            <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <span>UTC TIME-LOGGED PREVIEW</span>
          </div>
        </header>

        {/* Content Portal */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
