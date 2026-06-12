"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface SidebarLinkProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}

export default function SidebarLink({ href, icon, children }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition duration-150 ${
        isActive
          ? "bg-indigo-600/90 text-white shadow"
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      }`}
    >
      <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}>
        {icon}
      </span>
      <span>{children}</span>
    </Link>
  );
}
