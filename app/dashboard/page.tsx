import { getDashboardStats } from "@/actions/employees";
import { Users, UserCheck, UserX, Briefcase, DollarSign, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";

export const revalidate = 0; // Fetch stats fresh on every request

export default async function DashboardOverviewPage() {
  const result = await getDashboardStats();
  const stats = result.stats;

  const cards = [
    {
      title: "Total Headcount",
      value: stats.totalEmployees,
      subtitle: "Registered workers",
      icon: <Users className="h-5 w-5 text-indigo-600" />,
      colors: "bg-indigo-50 border-indigo-100",
      textCol: "text-indigo-900",
    },
    {
      title: "Active Staff",
      value: stats.activeEmployees,
      subtitle: `${stats.totalEmployees > 0 ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100) : 0}% of workforce`,
      icon: <UserCheck className="h-5 w-5 text-emerald-600" />,
      colors: "bg-emerald-50 border-emerald-100",
      textCol: "text-emerald-900",
    },
    {
      title: "Inactive Support",
      value: stats.inactiveEmployees,
      subtitle: "Deactivated archives",
      icon: <UserX className="h-5 w-5 text-rose-600" />,
      colors: "bg-rose-50 border-rose-100",
      textCol: "text-rose-900",
    },
    {
      title: "Total Departments",
      value: stats.departmentAnalytics.length,
      subtitle: "Active operating units",
      icon: <Briefcase className="h-5 w-5 text-cyan-600" />,
      colors: "bg-cyan-50 border-cyan-100",
      textCol: "text-cyan-900",
    },
  ];

  // Calculate global average salary safely
  let payrollSum = 0;
  stats.departmentAnalytics.forEach((d) => {
    payrollSum += d.totalSalary;
  });
  const averageSalary = stats.totalEmployees > 0 ? Math.round(payrollSum / stats.totalEmployees) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Intro Greetings */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-sm text-slate-500 mt-1 md:mt-1.5">
            Real-time organizational insights, payroll statistics, and modern employee records.
          </p>
        </div>
        <Link
          href="/dashboard/employees"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow"
        >
          Manage Employee Directory
        </Link>
      </div>

      {stats.totalEmployees === 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-semibold text-amber-900">Database is Currently Blank</h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              To test the sorting, search, and department analytics widgets, register your first employee records using the modular directory interface.
            </p>
          </div>
          <Link
            href="/dashboard/employees"
            className="bg-amber-800 hover:bg-amber-900 text-white px-3.5 py-1.5 rounded-md text-xs font-semibold shrink-0 transition"
          >
            + Create New Employee
          </Link>
        </div>
      )}

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className={`p-5 rounded-xl border flex flex-col gap-3 shadow-xs bg-white`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.colors}`}>{card.icon}</div>
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight text-slate-900">{card.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-1">{card.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-Column Analytic Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Department Aggregation Analytics */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-xl hidden md:flex flex-col overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                Department Distribution & Pay Scale
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Overview of staff density and average budget allocations
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 font-bold tracking-wider rounded font-mono">
              <TrendingUp className="h-3 w-3 text-indigo-500" />
              <span>PAYROLL</span>
            </div>
          </div>
          <div className="p-6 flex-1 flex flex-col gap-4">
            {stats.departmentAnalytics.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                <Briefcase className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs font-semibold">No departments found</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Create employees with department designations to calculate analytics.
                </p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {stats.departmentAnalytics.map((dept, i) => {
                  const percent = stats.totalEmployees > 0 ? (dept.count / stats.totalEmployees) * 100 : 0;
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{dept.name}</span>
                        <div className="space-x-2 text-slate-500">
                          <span>{dept.count} workers</span>
                          <span>•</span>
                          <span className="font-mono text-indigo-600 font-medium">
                            Avg: ${dept.averageSalary.toLocaleString()}/yr
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-150 flex items-center justify-between bg-slate-50/70 p-3.5 rounded-lg border">
              <div>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  Global Average Salary
                </p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">
                  ${averageSalary.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">/ year</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase text-right">
                  Total Payroll Sum
                </p>
                <p className="text-lg font-bold text-indigo-600 mt-0.5 text-right">
                  ${payrollSum.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">/ year</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Recently Onboarded Employees */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl flex flex-col overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Recent Additions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Last 5 employees joining the organization</p>
          </div>
          <div className="p-5 divide-y divide-slate-100 flex-1 flex flex-col justify-center">
            {stats.recentEmployees.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-lg">
                <Users className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-xs font-semibold">No recent records</p>
              </div>
            ) : (
              stats.recentEmployees.map((emp, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold text-xs ring-1 ring-slate-200 shrink-0">
                      {emp.fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 truncate max-w-[150px]">
                        {emp.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                        {emp.designation} • {emp.department}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-800">
                      ${emp.salary.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 justify-end font-mono">
                      <Calendar className="h-3 w-3 inline text-slate-400" />
                      {new Date(emp.joiningDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
