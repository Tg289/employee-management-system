"use server";

import { prisma } from "@/lib/prisma";
import { employeeSchema, type EmployeeInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export type GetEmployeesParams = {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
};

/**
 * Fetch list of employees with search, filter, sorting, and pagination
 */
export async function getEmployees(params: GetEmployeesParams) {
  try {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Apply filters
    if (params.search) {
      const searchLower = params.search.trim();
      where.OR = [
        { fullName: { contains: searchLower } },
        { email: { contains: searchLower } },
        { employeeId: { contains: searchLower } },
        { designation: { contains: searchLower } },
        { phone: { contains: searchLower } },
      ];
    }

    if (params.department && params.department !== "ALL") {
      where.department = params.department;
    }

    if (params.status && params.status !== "ALL") {
      where.status = params.status;
    }

    // Determine sorting
    let orderBy: any = { createdAt: "desc" };
    if (params.sortBy) {
      const field = params.sortBy;
      const direct = params.order || "asc";
      orderBy = { [field]: direct };
    }

    // Run queries concurrently
    const [totalItems, employees] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      success: true,
      data: employees,
      pagination: {
        currentPage: page,
        totalPages,
        limit,
        totalItems,
      },
    };
  } catch (error: any) {
    console.error("Failed to query employees database:", error);
    return {
      success: false,
      data: [],
      error: "Unable to retrieve employee records. Please try again later.",
      pagination: { currentPage: 1, totalPages: 1, limit: 10, totalItems: 0 },
    };
  }
}

/**
 * Create a new employee
 */
export async function createEmployee(input: EmployeeInput) {
  try {
    const validated = employeeSchema.parse(input);

    // Check for uniqueness of email and employeeId
    const existingEmail = await prisma.employee.findUnique({
      where: { email: validated.email },
    });
    if (existingEmail) {
      return { success: false, error: "An employee with this email already exists." };
    }

    const existingEmpId = await prisma.employee.findUnique({
      where: { employeeId: validated.employeeId },
    });
    if (existingEmpId) {
      return { success: false, error: "An employee with this Employee ID already exists." };
    }

    const employee = await prisma.employee.create({
      data: {
        ...validated,
        joiningDate: new Date(validated.joiningDate),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/employees");

    return { success: true, data: employee };
  } catch (error: any) {
    console.error("Failed to create employee:", error);
    return {
      success: false,
      error: error?.errors?.[0]?.message || "Could not complete employee registration.",
    };
  }
}

/**
 * Update an existing employee
 */
export async function updateEmployee(id: string, input: EmployeeInput) {
  try {
    const validated = employeeSchema.parse(input);

    // Verify record exists
    const current = await prisma.employee.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: "Employee account not found." };
    }

    // Check email limit
    if (validated.email !== current.email) {
      const existingEmail = await prisma.employee.findFirst({
        where: { email: validated.email, NOT: { id } },
      });
      if (existingEmail) {
        return { success: false, error: "An employee with this email already exists." };
      }
    }

    // Check employee ID limit
    if (validated.employeeId !== current.employeeId) {
      const existingId = await prisma.employee.findFirst({
        where: { employeeId: validated.employeeId, NOT: { id } },
      });
      if (existingId) {
        return { success: false, error: "An employee with this Employee ID already exists." };
      }
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...validated,
        joiningDate: new Date(validated.joiningDate),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/employees");

    return { success: true, data: employee };
  } catch (error: any) {
    console.error("Failed to update employee:", error);
    return {
      success: false,
      error: error?.errors?.[0]?.message || "Failed to update employee profile configuration.",
    };
  }
}

/**
 * Delete an employee
 */
export async function deleteEmployee(id: string) {
  try {
    await prisma.employee.delete({ where: { id } });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/employees");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete employee from database:", error);
    return {
      success: false,
      error: "Unable to delete employee. This account may not exist.",
    };
  }
}

/**
 * Aggregate system-wide analytics for Dashboard
 */
export async function getDashboardStats() {
  try {
    const totalEmployees = await prisma.employee.count();
    const activeEmployees = await prisma.employee.count({
      where: { status: "ACTIVE" },
    });

    // Department Analytics
    // Fetch all employees to aggregate in-memory/raw. Grouping in sqlite or postgres works differently,
    // so loading and summarizing manually is extremely stable and works identically regardless of DB provider!
    const allEmployees = await prisma.employee.findMany({
      select: {
        salary: true,
        department: true,
        status: true,
      },
    });

    const departmentMap: Record<string, { count: number; activeCount: number; totalSalary: number }> = {};
    allEmployees.forEach((emp) => {
      const dept = emp.department || "Unassigned";
      if (!departmentMap[dept]) {
        departmentMap[dept] = { count: 0, activeCount: 0, totalSalary: 0 };
      }
      departmentMap[dept].count += 1;
      if (emp.status === "ACTIVE") {
        departmentMap[dept].activeCount += 1;
      }
      departmentMap[dept].totalSalary += emp.salary;
    });

    const departmentAnalytics = Object.entries(departmentMap).map(([name, data]) => ({
      name,
      count: data.count,
      activeCount: data.activeCount,
      totalSalary: data.totalSalary,
      averageSalary: Math.round(data.count > 0 ? data.totalSalary / data.count : 0),
    }));

    // Recent 5 Employees
    const recentEmployees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return {
      success: true,
      stats: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees: totalEmployees - activeEmployees,
        departmentAnalytics,
        recentEmployees,
      },
    };
  } catch (error: any) {
    console.error("Dashboard statistics query failed:", error);
    return {
      success: false,
      stats: {
        totalEmployees: 0,
        activeEmployees: 0,
        inactiveEmployees: 0,
        departmentAnalytics: [],
        recentEmployees: [],
      },
      error: "Unable to calculate dashboard analytics.",
    };
  }
}
