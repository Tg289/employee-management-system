import { z } from "zod";

export const employeeSchema = z.object({
  employeeId: z
    .string()
    .min(3, "Employee ID must be at least 3 characters")
    .regex(/^[A-Za-z0-9-_]+$/, "Only letters, numbers, hyphens, and underscores are allowed"),
  fullName: z
    .string()
    .min(2, "Full Name must be at least 2 characters")
    .max(100, "Full Name must be under 100 characters")
    .trim(),
  email: z
    .string()
    .email("Please provide a valid email address")
    .trim()
    .toLowerCase(),
  phone: z
    .string()
    .min(7, "Phone number must be at least 7 digits")
    .max(16, "Phone number must be under 16 digits")
    .regex(/^\+?[0-9\s\-()]+$/, "Please enter a valid phone number format"),
  department: z
    .string()
    .min(1, "Department is required")
    .max(50, "Department must be under 50 characters"),
  designation: z
    .string()
    .min(1, "Designation is required")
    .max(50, "Designation must be under 50 characters"),
  salary: z.coerce
    .number()
    .positive("Salary must be a positive number"),
  joiningDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Please provide a valid joining date"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type EmployeeInput = z.infer<typeof employeeSchema>;
