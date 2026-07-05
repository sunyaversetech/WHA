"use client";
import { EmployeeForm } from "@/components/Dashboard/Employee/Form/EmployeeForm";
import { useGetSingleEmployee } from "@/services/employee.service";
import { useParams } from "next/navigation";
import React from "react";

export default function EmployeeEditPage() {
  const { id } = useParams();
  const { data, isLoading } = useGetSingleEmployee(id as string);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#051e3a] border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Loading team member…</p>
        </div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-gray-400">Team member not found.</p>
      </div>
    );
  }

  return <EmployeeForm initialData={data.data} />;
}
