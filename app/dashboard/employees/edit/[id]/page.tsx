"use client";
import { EmployeeForm } from "@/components/Dashboard/Employee/Form/EmployeeForm";
import { useGetSingleEmployee } from "@/services/employee.service";
import { useParams } from "next/navigation";

import React from "react";

const EmployeeEditForm = () => {
  const { id } = useParams();
  const { data } = useGetSingleEmployee(id as string);
  console.log("data", data);
  return <EmployeeForm initialData={data?.data} />;
};

export default EmployeeEditForm;
