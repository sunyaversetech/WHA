"use client";
import React from "react";
import { useSuperAdminGetALLUsers } from "@/services/super-admin.service";
import UserTable from "./UserTable";

const SuperAdminUser = () => {
  const { data } = useSuperAdminGetALLUsers();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Business Management
        </h1>
        <p className="text-gray-500 text-sm">
          Verify, block, or remove businesses from the platform.
        </p>
      </div>

      {data ? (
        <UserTable data={data.data} />
      ) : (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminUser;
