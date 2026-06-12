"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useToast } from "@/components/Toast";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  GetEmployeesParams,
} from "@/actions/employees";
import { employeeSchema } from "@/lib/validations";
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Loader2,
  Lock,
  Calendar,
  DollarSign,
  AlertCircle,
} from "lucide-react";

interface EmployeeDirectoryProps {
  initialEmployees: any[];
  initialPagination: {
    currentPage: number;
    totalPages: number;
    limit: number;
    totalItems: number;
  };
}

const DEPARTMENTS = [
  "Engineering",
  "Product Management",
  "Design",
  "Marketing",
  "Sales",
  "Finance",
  "Human Resources",
  "Legal",
  "Customer Support",
];

export default function EmployeeDirectory({
  initialEmployees,
  initialPagination,
}: EmployeeDirectoryProps) {
  const { success, error: toastError, info } = useToast();
  const [isPending, startTransition] = useTransition();

  // Employee storage states
  const [employees, setEmployees] = useState(initialEmployees);
  const [pagination, setPagination] = useState(initialPagination);

  // Active query filters state
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  // modal & loading states
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Inputs state for Create/Update employee
  const [formData, setFormData] = useState({
    employeeId: "",
    fullName: "",
    email: "",
    phone: "",
    department: DEPARTMENTS[0],
    designation: "",
    salary: "",
    joiningDate: new Date().toISOString().split("T")[0],
    status: "ACTIVE",
  });

  // Track filter updates and run transition querying
  const loadData = async (updatedParams: GetEmployeesParams) => {
    startTransition(async () => {
      const res = await getEmployees(updatedParams);
      if (res.success) {
        setEmployees(res.data);
        setPagination(res.pagination);
      } else {
        toastError(res.error || "Failed to load directory.");
      }
    });
  };

  // Re-run search & filter querying when dependencies change
  const handleQueryChange = (updates: Partial<GetEmployeesParams>) => {
    let newPage = page;
    if (Object.keys(updates).some((u) => ["search", "department", "status"].includes(u))) {
      newPage = 1; // Reset to page 1 on active filter changes
      setPage(1);
    }

    const currentParams: GetEmployeesParams = {
      search: updates.search !== undefined ? updates.search : search,
      department: updates.department !== undefined ? updates.department : selectedDept,
      status: updates.status !== undefined ? updates.status : selectedStatus,
      page: updates.page !== undefined ? updates.page : newPage,
      sortBy: updates.sortBy !== undefined ? updates.sortBy : sortBy,
      order: updates.order !== undefined ? updates.order : order,
      limit: 10,
    };

    loadData(currentParams);
  };

  const handleSortToggle = (field: string) => {
    const nextOrder = sortBy === field && order === "asc" ? "desc" : "asc";
    setSortBy(field);
    setOrder(nextOrder);
    handleQueryChange({ sortBy: field, order: nextOrder });
  };

  // Manage modall opening and filling
  const openCreateModal = () => {
    setModalMode("create");
    setValidationErrors({});
    setSelectedEmployee(null);
    setFormData({
      employeeId: "",
      fullName: "",
      email: "",
      phone: "",
      department: DEPARTMENTS[0],
      designation: "",
      salary: "",
      joiningDate: new Date().toISOString().split("T")[0],
      status: "ACTIVE",
    });
    setShowFormModal(true);
  };

  const openEditModal = (emp: any) => {
    setModalMode("edit");
    setValidationErrors({});
    setSelectedEmployee(emp);
    setFormData({
      employeeId: emp.employeeId,
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      designation: emp.designation,
      salary: emp.salary.toString(),
      joiningDate: new Date(emp.joiningDate).toISOString().split("T")[0],
      status: emp.status,
    });
    setShowFormModal(true);
  };

  const openDeleteModal = (emp: any) => {
    setEmployeeToDelete(emp);
    setShowDeleteModal(true);
  };

  // Submission handles
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Parse values for Zod check support
    const parsedPayload = {
      ...formData,
      salary: parseFloat(formData.salary),
    };

    // Client Side validations
    const result = employeeSchema.safeParse(parsedPayload);
    if (!result.success) {
      const errorMap: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          errorMap[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errorMap);
      toastError("Validation check failed. Please correct form elements.");
      return;
    }

    try {
      setFormLoading(true);
      let res;
      if (modalMode === "create") {
        res = await createEmployee(result.data);
      } else {
        res = await updateEmployee(selectedEmployee.id, result.data);
      }

      if (res.success) {
        success(
          modalMode === "create"
            ? "New employee enrolled successfully!"
            : "Employee record modified successfully!"
        );
        setShowFormModal(false);
        // Refresh directory data list
        handleQueryChange({});
      } else {
        toastError(res.error || "An error occurred submitting the record.");
      }
    } catch (err) {
      console.error(err);
      toastError("A severe runtime block occurred.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!employeeToDelete) return;
    try {
      setFormLoading(true);
      const res = await deleteEmployee(employeeToDelete.id);
      if (res.success) {
        success(`Removed ${employeeToDelete.fullName} from core registers.`);
        setShowDeleteModal(false);
        setEmployeeToDelete(null);
        handleQueryChange({});
      } else {
        toastError(res.error || "Could not delete employee record.");
      }
    } catch (err) {
      console.error(err);
      toastError("Unable to delete. Connection problem.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Employee Directory
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, paginate, sort, and execute administrative records operations.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition shadow shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Employee</span>
        </button>
      </div>

      {/* Query Filters Rails */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 gap-4 flex flex-col md:flex-row items-stretch md:items-center justify-between shadow-xs">
        {/* Search Bar Input */}
        <div className="flex-1 min-w-[280px] relative">
          <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID, or level..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleQueryChange({ search: e.target.value });
            }}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        {/* Filter Selection Grid */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter Selector */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                handleQueryChange({ department: e.target.value });
              }}
              className="py-1.5 px-3 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {DEPARTMENTS.map((dept, i) => (
                <option key={i} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter selection */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                handleQueryChange({ status: e.target.value });
              }}
              className="py-1.5 px-3 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Staff</option>
              <option value="INACTIVE">Inactive archives</option>
            </select>
          </div>

          {/* Refresh Loading Spinnings */}
          {isPending && (
            <div className="flex items-center gap-1.5 text-indigo-600 text-xs font-medium animate-pulse ml-2">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>Querying...</span>
            </div>
          )}
        </div>
      </div>

      {/* Directory Records Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                <th
                  onClick={() => handleSortToggle("fullName")}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Full Name</span>
                    <ArrowUpDown className="h-3 w-3 inline text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle("employeeId")}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Employee ID</span>
                    <ArrowUpDown className="h-3 w-3 inline text-slate-400" />
                  </div>
                </th>
                <th className="px-6 py-4">Department & Designation</th>
                <th
                  onClick={() => handleSortToggle("salary")}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Salary</span>
                    <ArrowUpDown className="h-3 w-3 inline text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle("joiningDate")}
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Joining Date</span>
                    <ArrowUpDown className="h-3 w-3 inline text-slate-400" />
                  </div>
                </th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1.5 p-4 max-w-sm mx-auto">
                      <AlertCircle className="h-8 w-8 text-slate-300" />
                      <p className="font-semibold text-slate-600">No directory records located</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Verify your filter criteria or register a new colleague to start editing database indexes.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex flex-col">
                        <span>{emp.fullName}</span>
                        <span className="text-slate-400 font-normal text-xs">{emp.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 tracking-wider">
                      {emp.employeeId}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex flex-col">
                        <span>{emp.designation}</span>
                        <span className="text-slate-400 text-xs">{emp.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      ${emp.salary.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                      {new Date(emp.joiningDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 rounded text-[10px] font-bold tracking-wider ${
                          emp.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-slate-150 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 bg-slate-50 border border-slate-150 text-slate-600 rounded hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                          title="Edit employee"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(emp)}
                          className="p-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded hover:bg-rose-100 hover:text-rose-950 transition cursor-pointer"
                          title="Delete employee record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50/55 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
            <div>
              Showing {employees.length} of {pagination.totalItems} entries
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1 || isPending}
                onClick={() => {
                  const prevPage = page - 1;
                  setPage(prevPage);
                  handleQueryChange({ page: prevPage });
                }}
                className="p-1.5 border border-slate-200 rounded bg-white hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="px-2 font-medium">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <button
                disabled={page >= pagination.totalPages || isPending}
                onClick={() => {
                  const nextPage = page + 1;
                  setPage(nextPage);
                  handleQueryChange({ page: nextPage });
                }}
                className="p-1.5 border border-slate-200 rounded bg-white hover:bg-slate-100 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT REGISTRATION MODAL FORM */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
          <div className="relative max-w-lg w-full bg-white p-6 rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-slide-in">
            {/* Modal Form Close */}
            <button
              onClick={() => setShowFormModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Title */}
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {modalMode === "create" ? "Register Employee Colleague" : "Modify Colleague Details"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ensure all parameters align with standard human resources guidelines.
            </p>

            {/* Inputs Grid Form */}
            <form onSubmit={handleFormSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="E.g., Victoria Sterling"
                    className="mt-1 w-full p-2 border border-slate-250 rounded-md text-sm focus:outline-none focus:ring-1.5 focus:ring-indigo-600 focus:border-indigo-600 bg-slate-50/20"
                  />
                  {validationErrors.fullName && (
                    <p className="text-xs text-rose-500 mt-1">{validationErrors.fullName}</p>
                  )}
                </div>

                {/* Email address */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="victoria@company.com"
                    className="mt-1 w-full p-2 border border-slate-250 rounded-md text-sm focus:outline-none focus:ring-1.5 focus:ring-indigo-600 focus:border-indigo-600 bg-slate-50/20"
                  />
                  {validationErrors.email && (
                    <p className="text-xs text-rose-500 mt-1">{validationErrors.email}</p>
                  )}
                </div>

                {/* Corporate Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Corporate Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    className="mt-1 w-full p-2 border border-slate-250 rounded-md text-sm focus:outline-none focus:ring-1.5 focus:ring-indigo-600 focus:border-indigo-600 bg-slate-50/20"
                  />
                  {validationErrors.phone && (
                    <p className="text-xs text-rose-500 mt-1">{validationErrors.phone}</p>
                  )}
                </div>

                {/* Employee ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Employee ID Reference
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <input
                      type="text"
                      required
                      placeholder="EMP-8219"
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                      className="w-full p-2 border border-slate-250 rounded-md text-sm focus:outline-none focus:ring-1.5 focus:ring-indigo-600 focus:border-indigo-600 bg-slate-50/20 uppercase"
                    />
                  </div>
                  {validationErrors.employeeId && (
                    <p className="text-xs text-rose-500 mt-1">{validationErrors.employeeId}</p>
                  )}
                </div>

                {/* Joining datepicker */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Enrolled Date
                  </label>
                  <div className="mt-1 relative rounded-md shadow-xs">
                    <input
                      type="date"
                      required
                      value={formData.joiningDate}
                      onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                      className="w-full p-2 border border-slate-250 rounded-md text-sm focus:outline-none focus:ring-1.5 focus:ring-indigo-600 focus:border-indigo-600 bg-slate-50/20 cursor-pointer"
                    />
                  </div>
                  {validationErrors.joiningDate && (
                    <p className="text-xs text-rose-500 mt-1">{validationErrors.joiningDate}</p>
                  )}
                </div>

                {/* Corporate Department */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="mt-1 w-full p-2 border border-slate-250 rounded-md text-sm focus:outline-none focus:ring-1.5 focus:ring-indigo-600 focus:border-indigo-600 bg-white cursor-pointer text-slate-700"
                  >
                    {DEPARTMENTS.map((dept, i) => (
                      <option key={i} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Designation */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Designation Role
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    placeholder="E.g., Principal Engineer"
                    className="mt-1 w-full p-2 border border-slate-250 rounded-md text-sm focus:outline-none focus:ring-1.5 focus:ring-indigo-600 focus:border-indigo-600 bg-slate-50/20"
                  />
                  {validationErrors.designation && (
                    <p className="text-xs text-rose-500 mt-1">{validationErrors.designation}</p>
                  )}
                </div>

                {/* Annual Salary */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Annual Base Salary ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="E.g., 145000"
                    className="mt-1 w-full p-2 border border-slate-250 rounded-md text-sm focus:outline-none focus:ring-1.5 focus:ring-indigo-600 focus:border-indigo-600 bg-slate-50/20"
                  />
                  {validationErrors.salary && (
                    <p className="text-xs text-rose-500 mt-1">{validationErrors.salary}</p>
                  )}
                </div>

                {/* Status selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Workplace Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full p-2 border border-slate-250 rounded-md text-sm focus:outline-none focus:ring-1.5 focus:ring-indigo-600 focus:border-indigo-600 bg-white cursor-pointer text-slate-700"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Form trigger submission */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-md text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-md text-xs transition shadow disabled:opacity-40 select-none cursor-pointer"
                >
                  {formLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : modalMode === "create" ? (
                    "Register Employee"
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL CHECKPOINT */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="max-w-md w-full bg-white p-6 rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-slide-in">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Permanently Remove Employee?
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              You are about to remove <span className="font-semibold text-slate-700">{employeeToDelete?.fullName}</span> (ID: <span className="font-mono text-slate-700">{employeeToDelete?.employeeId}</span>) from the main registry.
            </p>
            <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-850 leading-relaxed">
                Warning: File removal is irreversible. All indexes associated with this coworker, including history logs and department stats, will be deleted.
              </p>
            </div>
            {/* Modal deletes */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3.5 py-1.5 rounded-md text-xs transition cursor-pointer"
              >
                No, Keep Record
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={formLoading}
                className="flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3.5 py-1.5 rounded-md text-xs transition shadow disabled:opacity-40 select-none cursor-pointer"
              >
                {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
