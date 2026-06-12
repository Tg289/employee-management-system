import { getEmployees } from "@/actions/employees";
import EmployeeDirectory from "@/components/EmployeeDirectory";

export const revalidate = 0; // Fully dynamic fetch at request time

export default async function EmployeeDirectoryPage() {
  const result = await getEmployees({ page: 1, limit: 10, sortBy: "createdAt", order: "desc" });

  return (
    <EmployeeDirectory
      initialEmployees={result.data || []}
      initialPagination={
        result.pagination || {
          currentPage: 1,
          totalPages: 1,
          limit: 10,
          totalItems: 0,
        }
      }
    />
  );
}
